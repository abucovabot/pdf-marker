import os
import json
import fitz 
import re
from thefuzz import fuzz, process

# --- Configuration ---
# File paths for the source PDF and the input text data.
PDF_FILE_PATH = 'pdf-marker/public/1748195275_KT 2024 Final Offering Circular (bannerless).pdf'
TEXT_DATA_PATH = 'pdf-marker/src/iris_output_cleaned.json'
OUTPUT_FILE_PATH = 'pdf-marker/src/data7.json'

def normalize_text(text: str) -> str:
    """
    Cleans and standardizes a text string for reliable comparison.

    This function performs several operations:
    - Replaces various unicode quote characters with standard ones.
    - Replaces newlines and carriage returns with spaces.
    - Collapses multiple whitespace characters into a single space.
    - Removes unicode escape sequences.

    Args:
        text: The input string to normalize.

    Returns:
        The cleaned and normalized string.
    """
    if not text:
        return ""
    text = text.replace('“', '"').replace('”', '"')
    text = text.replace('‘', "'").replace('’', "'")
    text = text.replace('"', "'")
    text = text.replace('\n', ' ').replace('\r', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\\u[0-9a-fA-F]{4}', '', text)
    return text

def get_vertical_margins(pdf_path: str, page_number: int = 0, body_zone_ratio: float = 0.8) -> float:
    """
    Calculates a consistent vertical margin to ignore headers and footers.

    It analyzes a sample page to find the top and bottom of the main text body,
    excluding typical header/footer areas. It returns a single margin value
    to be applied to both top and bottom.

    Args:
        pdf_path: The path to the PDF file.
        page_number: The page number to analyze (0-indexed).
        body_zone_ratio: The central portion of the page to consider as the
                         main content area (e.g., 0.8 means the middle 80%).

    Returns:
        A single margin value in points, or 0 if an error occurs.
    """
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF to calculate margins: {e}")
        return 0

    if page_number >= len(doc):
        print(f"Error: Page {page_number} is out of bounds for margin calculation.")
        doc.close()
        return 0

    page = doc[page_number]
    page_height = page.rect.height

    margin_height = page_height * (1 - body_zone_ratio) / 2
    header_line = margin_height
    footer_line = page_height - margin_height

    text_blocks = page.get_text("blocks")
    body_blocks = [b for b in text_blocks if b[1] > header_line and b[3] < footer_line]

    if not body_blocks:
        print(f"Warning: No text blocks found in the body zone of page {page_number}. Using default margin.")
        doc.close()
        return 50  
    min_y0 = min(b[1] for b in body_blocks)
    max_y1 = max(b[3] for b in body_blocks)
    top_margin = min_y0
    bottom_margin = page_height - max_y1
    doc.close()
    buffer = 1.5 
    calculated_margin = min([top_margin, bottom_margin]) / buffer
    print(f"Calculated vertical margin: {calculated_margin:.2f} points")
    return calculated_margin

def cache_page_data(doc: fitz.Document, margin: float) -> list:
    """
    Pre-processes a PDF document to cache text data for faster searching.

    This function iterates through each page of the PDF once, extracting
    the words and their coordinates, and creating a normalized text string.
    This avoids repeated, slow `get_text` calls during the search process.

    Args:
        doc: The opened PyMuPDF document object.
        margin: The vertical margin to apply to exclude headers/footers.

    Returns:
        A list of dictionaries, where each dictionary represents a page and
        contains its 'words' and 'normalized_text'.
    """
    print("Caching PDF page data... this may take a moment.")
    page_cache = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        content_rect = fitz.Rect(page.rect.x0, page.rect.y0 + margin, page.rect.x1, page.rect.y1 - margin)
        words = page.get_text("words", clip=content_rect)
        page_text = " ".join([w[4] for w in words])
        normalized_page_text = normalize_text(page_text)
        page_cache.append({
            "words": words,
            "normalized_text": normalized_page_text
        })
    print("PDF caching complete.")
    return page_cache


# --- Core Search Functions ---

def find_best_match_substring(query: str, corpus: str, min_ratio: int = 90) -> tuple | None:
    """
    Finds the best fuzzy match of a query string within a larger corpus.

    This function is optimized for finding a phrase within a page of text.
    It breaks the corpus into chunks of similar word-length to the query
    to improve matching accuracy and speed with `thefuzz`.

    Args:
        query: The substring to search for.
        corpus: The larger text body to search within.
        min_ratio: The minimum similarity score (0-100) to consider a match.

    Returns:
        A tuple (start_index, end_index) of the match in the corpus, or None.
    """
    words = corpus.split()
    query_len_words = len(query.split())
    
    # Create a list of all possible substrings in the corpus that have the same number of words as the query
    choices = [" ".join(words[i:i + query_len_words]) for i in range(len(words) - query_len_words + 1)]
    
    if not choices:
        return None

    # Use thefuzz to find the best matching choice
    best_match, score = process.extractOne(query, choices, scorer=fuzz.ratio)
    
    if score < min_ratio:
        return None
    
    # Find the character index of the best match within the original corpus
    start_index = corpus.find(best_match)
    if start_index == -1:
        return None
        
    return start_index, start_index + len(best_match)

def find_paragraph_rect(page_cache_item: dict, search_paragraph: str, min_ratio: int = 90) -> fitz.Rect | None:
    """
    Finds a paragraph on a page using cached data and returns a tight bounding box.

    Args:
        page_cache_item: A dictionary from the pre-processed cache, containing
                         the page's 'words' and 'normalized_text'.
        search_paragraph: The text to search for on the page.
        min_ratio: The minimum similarity score for a fuzzy match.

    Returns:
        A fitz.Rect object representing the bounding box of the found text, or None.
    """
    words = page_cache_item["words"]
    normalized_page_text = page_cache_item["normalized_text"]
    
    if not words:
        return None

    normalized_search_text = normalize_text(search_paragraph)
    if not normalized_search_text:
        return None

    # Find the character start/end of the match in the normalized page text
    match_span = find_best_match_substring(normalized_search_text, normalized_page_text, min_ratio)
    if not match_span:
        return None
    start_char_idx, end_char_idx = match_span

    # --- Map character indices back to word indices ---
    page_text_for_mapping = ""
    char_to_word_idx = []
    for i, word_info in enumerate(words):
        word_text = word_info[4]
        page_text_for_mapping += word_text + " "
        # Create a lookup list where each character position maps to a word index
        char_to_word_idx.extend([i] * (len(word_text) + 1))

    # Ensure indices are within bounds
    if end_char_idx >= len(char_to_word_idx):
        end_char_idx = len(char_to_word_idx) - 1

    start_word_index = char_to_word_idx[start_char_idx]
    end_word_index = char_to_word_idx[end_char_idx]

    contributing_words = words[start_word_index : end_word_index + 1]
    if not contributing_words:
        return None

    # Combine the bounding boxes of all contributing words into one tight rectangle.
    total_bbox = fitz.Rect(contributing_words[0][:4])
    for word in contributing_words[1:]:
        total_bbox.include_rect(word[:4])

    return total_bbox

def find_spanning_text(page_num: int, search_text: str, page_cache: list) -> tuple | None:
    """
    Checks if a given text spans across two consecutive pages.

    This function is for the special case where a sentence or paragraph is
    split by a page break.

    Args:
        page_num: The starting page number (0-indexed) to check.
        search_text: The full text snippet to search for.
        page_cache: The pre-processed list of all page data.

    Returns:
        A tuple (1, text_on_page1, text_on_page2) if a match is found,
        otherwise None.
    """
    # Ensure there's a next page to check against
    if page_num + 1 >= len(page_cache):
        return None

    # Prepare data from the cache
    page1_text = page_cache[page_num]["normalized_text"]
    page2_text = page_cache[page_num + 1]["normalized_text"]
    
    # Split all texts into word lists for comparison
    page1_words = [word for word in page1_text.split(' ') if word]
    page2_words = [word for word in page2_text.split(' ') if word]
    sample_words = [word for word in normalize_text(search_text).split(' ') if word]

    if not sample_words or not page1_words:
        return None

    # Find all occurrences of the first word of our search text on the first page
    try:
        start_indices = [i for i, w in enumerate(page1_words) if w == sample_words[0]]
    except ValueError:
        start_indices = [] # Word not found

    if not start_indices:
        return None

    # Check each potential starting point for a full sequential match
    for start_pos in start_indices:
        match_len_p1 = 0
        match_len_p2 = 0

        # Check for a sequential match across page1 and then page2
        for i, s_word in enumerate(sample_words):
            if start_pos + i < len(page1_words):
                if s_word == page1_words[start_pos + i]:
                    match_len_p1 += 1
                else:
                    break 
            else:
                page2_idx = (start_pos + i) - len(page1_words)
                if page2_idx < len(page2_words) and s_word == page2_words[page2_idx]:
                    match_len_p2 += 1
                else:
                    break 
        
        # If we found a high percentage of the words, consider it a match
        total_found = match_len_p1 + match_len_p2
        
        if total_found >= 0.8 * len(sample_words):
            # Reconstruct the matched text segments from each page
            p1_match_str = ' '.join(page1_words[start_pos : start_pos + match_len_p1])
            p2_match_str = ' '.join(page2_words[0 : match_len_p2])
            return 1, p1_match_str, p2_match_str

    return None

# --- Main Execution Logic ---

def main():
    """
    Main function to run the PDF text marking process.
    """
    # 1. Load the search data from the JSON file
    try:
        with open(TEXT_DATA_PATH, 'r', encoding='utf-8') as f:
            text_data = json.load(f)['hits']['hits']
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading text data from {TEXT_DATA_PATH}: {e}")
        return

    # Categories to search for within the JSON data
    categories = [
        'ASSET_SALE', 'CHANGE_OF_CONTROL', 'EVENT_OF_DEFAULT', 
        "PERMITTED_INVESTMENTS", "PERMITTED_INDEBTEDNESS", "RESTRICTED_PAYMENTS",
        "OPTIONAL_REDEMPTION", "NEGATIVE_PLEDGE", 
        "TRANSACTIONS_WITH_SHAREHOLDERS_AND_AFFILIATES", "USE_OF_PROCEEDS", "RISK_FACTORS"
    ]
    
    # 2. Extract text snippets to find from the loaded data
    search_snippets_by_section = []
    if text_data:
        for item in text_data:
            snippets_for_this_section = []
            for category in categories:
                if category in item['_source']:
                    citations = item['_source'][category].get('SPLORE_CITATIONS', [])
                    for citation in citations:
                        # Ensure we only process citations for the target PDF
                        if citation.get('doc_name') == os.path.basename(PDF_FILE_PATH):
                            snippets_for_this_section.append(citation.get('reference_text', ''))
            search_snippets_by_section.append(snippets_for_this_section)
    
    if not search_snippets_by_section:
        print("No relevant text snippets to search for were found. Exiting.")
        return

    # 3. Pre-process and cache the PDF data for efficiency
    try:
        doc = fitz.open(PDF_FILE_PATH)
    except Exception as e:
        print(f"Failed to open PDF file {PDF_FILE_PATH}: {e}")
        return
        
    margin = get_vertical_margins(PDF_FILE_PATH)
    page_cache = cache_page_data(doc, margin)
    doc.close() # The document is no longer needed after caching

    # 4. Search for each snippet in the PDF
    results = [dict() for _ in range(len(search_snippets_by_section))]
    for section_idx, snippets in enumerate(search_snippets_by_section):
        if not snippets:
            continue
        
        print(f"--- Processing Section {section_idx + 1} of {len(search_snippets_by_section)} ---")
        extra_result_count = 0 # To handle multi-page results
        for snippet_idx, search_text in enumerate(snippets):
            if not search_text:
                continue

            found = False
            # a) Try to find the text on a single page
            for page_num, page_data in enumerate(page_cache):
                box = find_paragraph_rect(page_data, search_text)
                if box:
                    found = True
                    result_key = snippet_idx + extra_result_count
                    bbox_dict = {"x1": box.x0, "x2": box.x1, "y1": box.y0, "y2": box.y1}
                    results[section_idx][result_key] = [page_num + 1, bbox_dict, search_text]
                    print(f"  [OK] Found snippet {snippet_idx+1} on page {page_num + 1}")
                    break
            
            # b) If not found, check if it spans two pages
            if not found:
                for page_num in range(len(page_cache) - 1):
                    span_check = find_spanning_text(page_num, search_text, page_cache)
                    if span_check:
                        _, part1, part2 = span_check
                        # Find the bounding box for each part on its respective page
                        box1 = find_paragraph_rect(page_cache[page_num], part1)
                        box2 = find_paragraph_rect(page_cache[page_num + 1], part2)
                        
                        if box1 and box2:
                            print(f"  [OK] Found snippet {snippet_idx+1} spanning pages {page_num + 1} and {page_num + 2}")
                            # Add result for the first page
                            bbox_dict1 = {"x1": box1.x0, "x2": box1.x1, "y1": box1.y0, "y2": box1.y1}
                            results[section_idx][snippet_idx + extra_result_count] = [page_num + 1, bbox_dict1, part1]
                            
                            # Increment counter and add result for the second page
                            extra_result_count += 1
                            bbox_dict2 = {"x1": box2.x0, "x2": box2.x1, "y1": box2.y0, "y2": box2.y1}
                            results[section_idx][snippet_idx + extra_result_count] = [page_num + 2, bbox_dict2, part2]
                            
                            found = True
                            break
            
            if not found:
                 print(f"  [!!] Could not find snippet {snippet_idx+1}: '{search_text[:60]}...'")

    # 5. Format and save the results
    for section_idx, section_results in enumerate(results):
        if section_idx < len(text_data):
            text_data[section_idx]['citations'] = []
            sorted_keys = sorted(section_results.keys())

            for key in sorted_keys:
                page_num, bbox, reference_text = section_results[key]
                new_citation = {
                    'chunk_bbox': [bbox],
                    'page_index': [page_num],
                    'reference_text': reference_text,
                    'id': str(key + 1),
                    'chunk_order': [0],
                    'doc_id': "ABFS2xb8Bikb7HwYOWm4Iyb6OTg6pnQ", # Placeholder/Example ID
                    'doc_name': os.path.basename(PDF_FILE_PATH)
                }
                text_data[section_idx]['citations'].append(new_citation)
    
    # Generate a 'response' text field from the found citations
    if text_data:
        for section_idx, section_data in enumerate(text_data):
            response = f'### {section_idx}\n\n'
            if 'citations' in section_data:
                for citation in section_data['citations']:
                    text = citation['reference_text']
                    response += text + '\n\n'
            section_data['response'] = response

    with open(OUTPUT_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(text_data, f, indent=2, ensure_ascii=False)

    print(f"\nProcessing complete. Output saved to {OUTPUT_FILE_PATH}")

if __name__ == "__main__":
    main()
