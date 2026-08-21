#set page(
  paper: "a4",
  flipped: true,
  margin: (x: 1.5cm, y: 1.5cm),
  fill: rgb("#FDF6E3"), 
)

#set text(
  font: ("Libertinus Serif", "Noto Naskh Arabic"),
  fill: rgb("#1A1A2E"), 
  size: 12pt,
)

// Background Watermark Motif (Raised to Header Level and Enlarged)
#place(center + top, dy: 0cm)[
  #text(size: 720pt, fill: rgb("#C9A227").transparentize(95%), font: "Noto Naskh Arabic")[ع]
]

// Elegant Frame
#place(center + horizon)[
  #rect(
    width: 272mm,
    height: 185mm,
    stroke: 2pt + rgb("#C9A227"),
    radius: 4pt,
  )
]

#place(center + horizon)[
  #rect(
    width: 266mm,
    height: 179mm,
    stroke: 5pt + rgb("#1A1A2E"),
    radius: 2pt,
    inset: 1.2cm,
  )[
    #align(center)[
      #v(0.1cm)
      
      // Header Branding
      #text(size: 34pt, fill: rgb("#1A1A2E"), weight: "black")[
        ARABIC#text(fill: rgb("#C9A227"))[1010]
      ]
      
      #v(0.4cm)
      
      // Synchronized Bilingual Titles
      #text(size: 26pt, fill: rgb("#1A1A2E"), weight: "bold", font: "Noto Naskh Arabic")[
        شَهَادَةُ الكَفَاءَةِ التَّأْسِيسِيَّةِ فِي الثَّقَافَةِ العَرَبِيَّةِ الرَّقْمِيَّةِ
      ]
      
      #v(0.15cm)
      
      #text(size: 18pt, style: "italic", weight: "bold", fill: rgb("#1A1A2E"))[
        Certificate of Foundational Competence in Digital Arabic Literacy
      ]
      
      #v(0.1cm)
      
      #text(size: 13pt, weight: "bold", fill: rgb("#C9A227"))[
        (Level 1 / المُسْتَوَى الأَوَّل)
      ]
      
      #v(0.4cm) 
      
      #text(size: 15pt, weight: "medium")[This is to certify that]
      
      #v(0.2cm)
      
      // The Hero Section: Student Name
      #text(size: 44pt, weight: "black", fill: rgb("#7B2020"))[
        ARABIC LEARNER
      ]
      
      #v(0.3cm)
      
      #line(length: 55%, stroke: 2pt + rgb("#C9A227"))
      
      #v(0.4cm)
      
      #block(width: 80%)[
        #set par(leading: 0.9em)
        #text(size: 15pt, weight: "medium")[
          has successfully completed the foundational curriculum of Arabic1010, demonstrating competence in Arabic orthography, phonology, and digital register awareness at a Level 1 proficiency.
        ]
      ]
    ]
  ]
]

// Footer Elements: Absolute Positioning
// Date Section (Bottom Center)
#place(bottom + center, dy: -3.8cm)[
  #stack(dir: ttb, spacing: 0.3cm,
    text(size: 10pt, fill: rgb("#1A1A2E").lighten(30%), weight: "bold")[DATE OF ISSUANCE],
    text(size: 14pt, weight: "bold")[August 21, 2026],
    line(length: 5cm, stroke: 1.2pt + rgb("#1A1A2E"))
  )
]

// Official Seal with Ribbon (Bottom Left)
#place(bottom + left, dx: 0.5cm, dy: -3.5cm)[
  #stack(dir: ttb, spacing: -1.2cm,
    // The Ribbon
    align(center)[
      #polygon(
        fill: rgb("#7B2020"),
        (0cm, 0cm), (1.2cm, 0cm), (1.2cm, 3.2cm), (0.6cm, 2.6cm), (0cm, 3.2cm)
      )
      #h(0.4cm)
      #polygon(
        fill: rgb("#7B2020").darken(10%),
        (0cm, 0cm), (1.2cm, 0cm), (1.2cm, 3.2cm), (0.6cm, 2.6cm), (0cm, 3.2cm)
      )
    ],
    // The Seal
    align(center)[
      #circle(radius: 2cm, stroke: 3pt + rgb("#C9A227"), fill: white)[
        #align(center + horizon)[
          #stack(dir: ttb, spacing: 0.1cm,
            text(size: 5pt, fill: rgb("#1A1A2E"), weight: "black")[ARABIC1010 FOUNDATION],
            text(size: 38pt, fill: rgb("#C9A227"), weight: "black", font: "Noto Naskh Arabic")[ع],
            text(size: 5pt, fill: rgb("#1A1A2E"), weight: "black")[DIGITAL LITERACY SEAL]
          )
        ]
      ]
    ]
  )
]

// Signature Section (Bottom Right)
#place(bottom + right, dx: -0.5cm, dy: -3.8cm)[
  #stack(dir: ttb, spacing: 0.5cm,
    text(size: 26pt, font: "Noto Naskh Arabic", fill: rgb("#1A1A2E"), weight: "bold")[د. علي الهاشمي رداوي],
    text(size: 20pt, font: "Libertinus Serif", style: "italic", weight: "bold", fill: rgb("#1A1A2E"))[Dr. Ali H. Raddaoui],
    line(length: 8.5cm, stroke: 1.2pt + rgb("#1A1A2E")),
    align(center)[#text(size: 11pt, fill: rgb("#1A1A2E").lighten(30%), weight: "bold")[LEAD LINGUIST & FOUNDER]]
  )
]

// Credential ID (Very Bottom - Moved further down to prevent overlap)
#place(bottom + center, dy: -0.5cm)[
  #text(size: 9pt, fill: rgb("#1A1A2E").lighten(50%), weight: "bold")[
    Credential ID: A1010-8829-XL02-2026 #h(1cm) Verify authenticity at: arabic1010.com/verify
  ]
]
