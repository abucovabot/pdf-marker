export interface ChunkWithBBox {
    reference_text: string;
    page_num: number;
    chunk_bbox: [number, number, number, number]; // [x, y, width, height] or [x1, y1, x2, y2]
}

export const chunks: ChunkWithBBox[] = [
    {
    reference_text: 'long-term debt Issuer rated BB+ (stable outlook) S&P Global Ratings ("S&P"). Notes assigned rating BB+ S&P. date Prospectus, S&P established European Union, registered Regulation (EC) No. 1060/2009 credit rating agencies, amended (the "CRA Regulation") included list registered credit rating agencies published European Securities Markets Authority website (https://www.esma.europa.eu/supervision/credit-rating-agencies/risk) accordance CRA Regulation. S&P established United Kingdom (the "UK") registered accordance Regulation (EC) No. 1060/2009 forms part UK domestic law virtue European Union (Withdrawal) Act 2018 (the "EUWA") (the "UK CRA Regulation"). However, rating Issuer endorsed S&P Global Ratings UK Limited, accordance UK CRA Regulation withdrawn. such, rating issued S&P may used regulatory purposes UK accordance UK CRA Regulation. Credit ratings subject revision, suspension withdrawal time relevant rating organisation. credit rating recommendation buy, sell hold securities.',
    page_num: 0,
    chunk_bbox: [
      68.54000091552734,
      674.739990234375,
      525.780029296875,
      771.7000122070312
    ] as [number, number, number, number],
},
{
    reference_text: "Notes registered U.S. Securities Act 1933, amended (the \"Securities Act\") and, subject certain exceptions, may offered, sold delivered within United States to, account benefit of, U.S. persons (as defined Regulation Securities Act (\"Regulation S\")). person authorised give information make representation contained Prospectus information representation contained must relied upon authorised behalf Issuer Managers. Neither delivery Prospectus sale made connection herewith shall, circumstances, create implication change affairs Issuer Group since date hereof date upon Prospectus recently amended supplemented adverse change financial position Issuer Group since date hereof date upon Prospectus recently amended supplemented information contained information supplied connection Notes correct time subsequent date supplied or, different, date indicated document containing same. prospective investor Notes must determine, based independent review professional advice deems appropriate circumstances, acquisition Notes fully consistent financial needs, objectives condition, complies fully consistent investment policies, guidelines restrictions applicable fit, proper suitable investment it, notwithstanding clear substantial risks inherent investing holding Notes. prospective investor may rely Issuer Managers respective affiliates connection determination legality acquisition Notes matters referred above.",
    page_num: 2,
    chunk_bbox: [
    68.54000091552734,
    400.3699951171875,
    525.52001953125,
    730.0599975585938
  ] as [number, number, number, number],
}, {
    reference_text: "distribution Prospectus offering Notes certain jurisdictions may restricted law. Persons whose possession Prospectus comes required Issuer inform about, observe, restrictions. Investors inform additional costs incurred connection purchase, custody sale Notes investing Notes may result losing part investment Notes. PRIIPS regulation / prohibition sales EEA retail investors – Notes intended offered, sold otherwise made available offered, sold otherwise made available retail investor European Economic Area (\"EEA\"). purposes, retail investor means person one (or more) of: (i) retail client defined point (11) Article 4(1) Directive (EU) 2014/65 (as amended, \"MiFID II\"); (ii) customer within meaning Directive (EU) 2016/97 (as amended), customer would qualify professional client defined point (10) Article 4(1) MiFID II; (iii) qualified investor defined Prospectus Regulation. Consequently, key information document required Regulation (EU) No. 1286/2014 (as amended, \"PRIIPs Regulation\") offering selling Notes otherwise making available retail investors EEA prepared therefore offering selling Notes otherwise making available retail investor EEA may unlawful PRIIPs Regulation.",
    page_num: 3,
    chunk_bbox: [
    68.54000091552734,
    71.4000015258789,
    525.4400024414062,
    322.7300109863281
  ] as [number, number, number, number],
},
];