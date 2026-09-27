/** Exact category and subtype labels from the supplied clickable HTML. */
export type LocalizedTaxon = { id: string; fa: string; ar: string; en: string; fr: string }
export type DidarTaxon = LocalizedTaxon & { family: string; types: readonly LocalizedTaxon[]; future?: boolean }
export const didarFamilies: readonly (LocalizedTaxon & { pending?: boolean })[] = [
  {
    "id": "jewelry",
    "fa": "زیورآلات بدنی",
    "ar": "المجوهرات",
    "en": "Jewelry",
    "fr": "Bijoux"
  },
  {
    "id": "accessories",
    "fa": "اکسسوری‌ها",
    "ar": "الإكسسوارات",
    "en": "Accessories",
    "fr": "Accessoires"
  },
  {
    "id": "sets",
    "fa": "ست‌ها و پک‌های ترکیبی",
    "ar": "الأطقم والباقات",
    "en": "Sets & packs",
    "fr": "Parures et coffrets"
  },
  {
    "id": "bullion",
    "fa": "محصولات سرمایه‌ای",
    "ar": "منتجات الذهب الاستثماري",
    "en": "Bullion & coins",
    "fr": "Lingots et pièces"
  },
  {
    "id": "symbolic",
    "fa": "اقلام مفهومی / نمادین",
    "ar": "المنتجات الرمزية",
    "en": "Symbolic products",
    "fr": "Objets symboliques",
    "pending": true
  }
] as const

export const didarTaxonomy: readonly DidarTaxon[] = [
  {
    "id": "rings",
    "family": "jewelry",
    "fa": "انگشتر",
    "ar": "الخواتم",
    "en": "Rings",
    "fr": "Bagues",
    "types": [
      {
        "id": "rings-wedding",
        "fa": "حلقه ازدواج",
        "ar": "خاتم زواج",
        "en": "Wedding band",
        "fr": "Alliance"
      },
      {
        "id": "rings-engagement",
        "fa": "حلقه نامزدی",
        "ar": "خاتم خطوبة",
        "en": "Engagement ring",
        "fr": "Bague de fiançailles"
      },
      {
        "id": "rings-solitaire",
        "fa": "سولیتر",
        "ar": "سوليتير",
        "en": "Solitaire",
        "fr": "Solitaire"
      },
      {
        "id": "rings-halo",
        "fa": "هالو",
        "ar": "هالو",
        "en": "Halo",
        "fr": "Halo"
      },
      {
        "id": "rings-gemset",
        "fa": "جواهردار",
        "ar": "مرصع بالأحجار",
        "en": "Gem-set",
        "fr": "Sertie de pierres"
      },
      {
        "id": "rings-fantasy",
        "fa": "فانتزی",
        "ar": "تصميم مبتكر",
        "en": "Fantasy",
        "fr": "Fantaisie"
      },
      {
        "id": "rings-cocktail",
        "fa": "کوکتل",
        "ar": "كوكتيل",
        "en": "Cocktail",
        "fr": "Cocktail"
      },
      {
        "id": "rings-sport-men",
        "fa": "اسپرت / مردانه",
        "ar": "رياضي / رجالي",
        "en": "Sport / men’s",
        "fr": "Sport / homme"
      },
      {
        "id": "rings-adjustable",
        "fa": "قابل تنظیم",
        "ar": "قابل للتعديل",
        "en": "Adjustable",
        "fr": "Réglable"
      }
    ]
  },
  {
    "id": "earrings",
    "family": "jewelry",
    "fa": "گوشواره",
    "ar": "الأقراط",
    "en": "Earrings",
    "fr": "Boucles d’oreilles",
    "types": [
      {
        "id": "earrings-stud",
        "fa": "میخی",
        "ar": "مسماري",
        "en": "Stud",
        "fr": "Puces"
      },
      {
        "id": "earrings-hoop",
        "fa": "حلقه‌ای",
        "ar": "حلقي",
        "en": "Hoop",
        "fr": "Créoles"
      },
      {
        "id": "earrings-drop",
        "fa": "آویزی",
        "ar": "متدلٍ",
        "en": "Drop",
        "fr": "Pendantes"
      },
      {
        "id": "earrings-clip",
        "fa": "چسبان / کلیپ‌دار",
        "ar": "لاصق / مشبك",
        "en": "Clip-on",
        "fr": "À clips"
      },
      {
        "id": "earrings-threader",
        "fa": "بخیه‌ای",
        "ar": "خيط متدلٍ",
        "en": "Threader",
        "fr": "Enfile-aiguille"
      },
      {
        "id": "earrings-piercing",
        "fa": "پیرسینگ گوش",
        "ar": "ثقب الأذن",
        "en": "Ear piercing",
        "fr": "Piercing d’oreille"
      },
      {
        "id": "earrings-double",
        "fa": "ست / دوبل",
        "ar": "طقم / مزدوج",
        "en": "Set / double",
        "fr": "Ensemble / double"
      },
      {
        "id": "earrings-bridal",
        "fa": "عروس",
        "ar": "عروس",
        "en": "Bridal",
        "fr": "Mariée"
      }
    ]
  },
  {
    "id": "necklaces",
    "family": "jewelry",
    "fa": "گردنبند",
    "ar": "القلائد",
    "en": "Necklaces",
    "fr": "Colliers",
    "types": [
      {
        "id": "necklaces-simple-chain",
        "fa": "زنجیر ساده",
        "ar": "سلسلة بسيطة",
        "en": "Simple chain",
        "fr": "Chaîne simple"
      },
      {
        "id": "necklaces-pendant",
        "fa": "گردنبند با آویز",
        "ar": "قلادة بتعليقة",
        "en": "Pendant necklace",
        "fr": "Collier à pendentif"
      },
      {
        "id": "necklaces-choker",
        "fa": "چوکر",
        "ar": "تشوكر",
        "en": "Choker",
        "fr": "Ras-de-cou"
      },
      {
        "id": "necklaces-layered",
        "fa": "لایه‌ای",
        "ar": "متعدد الطبقات",
        "en": "Layered",
        "fr": "Multirang"
      }
    ]
  },
  {
    "id": "bracelets",
    "family": "jewelry",
    "fa": "دستبند",
    "ar": "الأساور",
    "en": "Bracelets",
    "fr": "Bracelets",
    "types": [
      {
        "id": "bracelets-clasp",
        "fa": "قفلی",
        "ar": "بقفل",
        "en": "Clasp",
        "fr": "À fermoir"
      },
      {
        "id": "bracelets-charm",
        "fa": "آویزدار / Charm",
        "ar": "بتعليقات",
        "en": "Charm",
        "fr": "À charms"
      },
      {
        "id": "bracelets-leather",
        "fa": "چرمی + طلا",
        "ar": "جلد وذهب",
        "en": "Leather & gold",
        "fr": "Cuir et or"
      },
      {
        "id": "bracelets-stone",
        "fa": "سنگ‌دار",
        "ar": "مرصع بالأحجار",
        "en": "Stone-set",
        "fr": "Avec pierres"
      }
    ]
  },
  {
    "id": "bangles",
    "family": "jewelry",
    "fa": "النگو",
    "ar": "الأساور الصلبة",
    "en": "Bangles",
    "fr": "Joncs",
    "types": [
      {
        "id": "bangles-bangle",
        "fa": "النگو / Bangle",
        "ar": "سوار صلب",
        "en": "Bangle",
        "fr": "Jonc"
      }
    ]
  },
  {
    "id": "anklets",
    "family": "jewelry",
    "fa": "پابند",
    "ar": "الخلاخيل",
    "en": "Anklets",
    "fr": "Chaînes de cheville",
    "types": [
      {
        "id": "anklets-ring",
        "fa": "پابند حلقه‌ای",
        "ar": "خلخال حلقي",
        "en": "Ring anklet",
        "fr": "Chevillière à anneaux"
      }
    ]
  },
  {
    "id": "body",
    "family": "jewelry",
    "fa": "زیورآلات بدن",
    "ar": "حلي الجسم",
    "en": "Body jewelry",
    "fr": "Bijoux de corps",
    "types": [
      {
        "id": "body-body",
        "fa": "بدن‌تزئینی",
        "ar": "حلي الجسم",
        "en": "Body jewelry",
        "fr": "Bijou de corps"
      }
    ]
  },
  {
    "id": "pendants",
    "family": "jewelry",
    "fa": "آویز / پلاک",
    "ar": "التعليقات",
    "en": "Pendants",
    "fr": "Pendentifs",
    "types": [
      {
        "id": "pendants-fixed",
        "fa": "ثابت",
        "ar": "ثابت",
        "en": "Fixed",
        "fr": "Fixe"
      },
      {
        "id": "pendants-name",
        "fa": "سفارشی / اسم",
        "ar": "مخصص / اسم",
        "en": "Custom / name",
        "fr": "Personnalisé / prénom"
      },
      {
        "id": "pendants-charm",
        "fa": "Charm",
        "ar": "تعليقة صغيرة",
        "en": "Charm",
        "fr": "Charm"
      }
    ]
  },
  {
    "id": "chains",
    "family": "jewelry",
    "fa": "زنجیر",
    "ar": "السلاسل",
    "en": "Chains",
    "fr": "Chaînes",
    "types": [
      {
        "id": "chains-plain",
        "fa": "ساده",
        "ar": "بسيط",
        "en": "Plain",
        "fr": "Simple"
      },
      {
        "id": "chains-woven",
        "fa": "بافت‌دار",
        "ar": "منسوج",
        "en": "Woven",
        "fr": "Tressée"
      },
      {
        "id": "chains-box",
        "fa": "Box",
        "ar": "بوكس",
        "en": "Box",
        "fr": "Maille vénitienne"
      }
    ]
  },
  {
    "id": "cufflinks",
    "family": "accessories",
    "fa": "دکمه سردست",
    "ar": "أزرار الأكمام",
    "en": "Cufflinks",
    "fr": "Boutons de manchette",
    "types": [
      {
        "id": "cufflinks-classic",
        "fa": "Cufflinks",
        "ar": "أزرار أكمام",
        "en": "Cufflinks",
        "fr": "Boutons de manchette"
      }
    ]
  },
  {
    "id": "tie-clips",
    "family": "accessories",
    "fa": "گیره کراوات",
    "ar": "مشابك ربطات العنق",
    "en": "Tie clips",
    "fr": "Pinces à cravate",
    "types": [
      {
        "id": "tie-clips-clip",
        "fa": "Tie Clip",
        "ar": "مشبك ربطة عنق",
        "en": "Tie clip",
        "fr": "Pince à cravate"
      }
    ]
  },
  {
    "id": "brooches",
    "family": "accessories",
    "fa": "سنجاق سینه",
    "ar": "الدبابيس",
    "en": "Brooches",
    "fr": "Broches",
    "types": [
      {
        "id": "brooches-classic",
        "fa": "کلاسیک دایره‌ای / بیضی",
        "ar": "كلاسيكي دائري / بيضاوي",
        "en": "Classic round / oval",
        "fr": "Classique ronde / ovale"
      },
      {
        "id": "brooches-symbolic",
        "fa": "مفهومی / نمادین",
        "ar": "مفاهيمي / رمزي",
        "en": "Conceptual / symbolic",
        "fr": "Conceptuelle / symbolique"
      },
      {
        "id": "brooches-lapel",
        "fa": "سنجاق کت مردانه",
        "ar": "دبوس سترة رجالي",
        "en": "Men’s lapel pin",
        "fr": "Épingle de revers homme"
      }
    ]
  },
  {
    "id": "scarf-clips",
    "family": "accessories",
    "fa": "گیره روسری",
    "ar": "مشابك الأوشحة",
    "en": "Scarf clips",
    "fr": "Attaches de foulard",
    "types": [
      {
        "id": "scarf-clips-ring",
        "fa": "حلقه‌ای",
        "ar": "حلقي",
        "en": "Ring",
        "fr": "Anneau"
      },
      {
        "id": "scarf-clips-pin",
        "fa": "سوزنی / سنجاق‌دار",
        "ar": "إبرة / دبوس",
        "en": "Pin",
        "fr": "Épingle"
      }
    ]
  },
  {
    "id": "hair",
    "family": "accessories",
    "fa": "اکسسوری مو",
    "ar": "إكسسوارات الشعر",
    "en": "Hair accessories",
    "fr": "Accessoires de cheveux",
    "types": [
      {
        "id": "hair-clip",
        "fa": "سنجاق مو",
        "ar": "مشبك شعر",
        "en": "Hair clip",
        "fr": "Barrette"
      },
      {
        "id": "hair-comb",
        "fa": "شانه تزئینی پهن",
        "ar": "مشط مزخرف عريض",
        "en": "Wide decorative comb",
        "fr": "Peigne décoratif large"
      },
      {
        "id": "hair-pin",
        "fa": "سنجاق مویی ساده",
        "ar": "دبوس شعر بسيط",
        "en": "Simple hairpin",
        "fr": "Épingle simple"
      }
    ]
  },
  {
    "id": "tiaras",
    "family": "accessories",
    "fa": "تاج / نیم‌تاج",
    "ar": "التيجان",
    "en": "Crowns & tiaras",
    "fr": "Couronnes et diadèmes",
    "types": [
      {
        "id": "tiaras-bridal",
        "fa": "نیم‌تاج عروسی",
        "ar": "تاج عروس",
        "en": "Bridal tiara",
        "fr": "Diadème de mariée"
      },
      {
        "id": "tiaras-kids",
        "fa": "تاج کودک / دکوری",
        "ar": "تاج طفل / زينة",
        "en": "Kids / decorative crown",
        "fr": "Couronne enfant / décorative"
      }
    ]
  },
  {
    "id": "forehead",
    "family": "accessories",
    "fa": "زیور پیشانی",
    "ar": "حلي الجبين",
    "en": "Forehead jewelry",
    "fr": "Bijoux de front",
    "types": [
      {
        "id": "forehead-tikka",
        "fa": "زنجیر سنتی پیشانی / Maang Tikka",
        "ar": "سلسلة جبين / مانغ تيكا",
        "en": "Maang tikka / forehead chain",
        "fr": "Maang tikka / chaîne de front"
      },
      {
        "id": "forehead-plate",
        "fa": "پلاک پیشانی",
        "ar": "تعليقة الجبين",
        "en": "Forehead pendant",
        "fr": "Pendentif de front"
      }
    ]
  },
  {
    "id": "full-set",
    "family": "sets",
    "fa": "سرویس کامل",
    "ar": "طقم كامل",
    "en": "Full set",
    "fr": "Parure complète",
    "types": [
      {
        "id": "full-set-set",
        "fa": "ست کامل طلا",
        "ar": "طقم ذهب كامل",
        "en": "Full gold set",
        "fr": "Parure complète en or"
      }
    ]
  },
  {
    "id": "half-set",
    "family": "sets",
    "fa": "نیم‌ست",
    "ar": "نصف طقم",
    "en": "Half set",
    "fr": "Demi-parure",
    "types": [
      {
        "id": "half-set-set",
        "fa": "نیم‌ست",
        "ar": "نصف طقم",
        "en": "Half set",
        "fr": "Demi-parure"
      }
    ]
  },
  {
    "id": "mother-child",
    "family": "sets",
    "fa": "ست مادر و کودک",
    "ar": "طقم الأم والطفل",
    "en": "Mother & child set",
    "fr": "Ensemble mère et enfant",
    "types": [
      {
        "id": "mother-child-set",
        "fa": "Mother & Child Set",
        "ar": "طقم الأم والطفل",
        "en": "Mother & child set",
        "fr": "Ensemble mère et enfant"
      }
    ]
  },
  {
    "id": "occasion-pack",
    "family": "sets",
    "fa": "پک مناسبتی",
    "ar": "باقة مناسبات",
    "en": "Occasion pack",
    "fr": "Coffret occasion",
    "types": [
      {
        "id": "occasion-pack-set",
        "fa": "هدیه / مناسبتی",
        "ar": "هدية / مناسبة",
        "en": "Gift / occasion pack",
        "fr": "Coffret cadeau / occasion"
      }
    ]
  },
  {
    "id": "mens-set",
    "family": "sets",
    "fa": "ست مردانه",
    "ar": "طقم رجالي",
    "en": "Men’s set",
    "fr": "Parure homme",
    "types": [
      {
        "id": "mens-set-set",
        "fa": "ست مردانه",
        "ar": "طقم رجالي",
        "en": "Men’s set",
        "fr": "Parure homme"
      }
    ]
  },
  {
    "id": "everyday-pack",
    "family": "sets",
    "fa": "پک اقتصادی / روزمره",
    "ar": "باقة اقتصادية / يومية",
    "en": "Everyday / value pack",
    "fr": "Coffret quotidien / économique",
    "types": [
      {
        "id": "everyday-pack-set",
        "fa": "Everyday / Value Pack",
        "ar": "باقة يومية / اقتصادية",
        "en": "Everyday / value pack",
        "fr": "Coffret quotidien / économique"
      }
    ]
  },
  {
    "id": "kids-pack",
    "family": "sets",
    "fa": "پک کودک / نوجوان",
    "ar": "باقة أطفال / مراهقين",
    "en": "Kids / teen pack",
    "fr": "Coffret enfant / ado",
    "types": [
      {
        "id": "kids-pack-set",
        "fa": "Kids / Teen Pack",
        "ar": "باقة أطفال / مراهقين",
        "en": "Kids / teen pack",
        "fr": "Coffret enfant / ado"
      }
    ]
  },
  {
    "id": "standard-bars",
    "family": "bullion",
    "fa": "شمش استاندارد",
    "ar": "سبائك قياسية",
    "en": "Standard bars",
    "fr": "Lingots standard",
    "types": [
      {
        "id": "standard-bars-metric",
        "fa": "شمش متریک",
        "ar": "سبيكة مترية",
        "en": "Metric bar",
        "fr": "Lingot métrique"
      },
      {
        "id": "standard-bars-troy",
        "fa": "شمش یک اونسی",
        "ar": "سبيكة أونصة تروي",
        "en": "One troy ounce bar",
        "fr": "Lingot d’une once troy"
      }
    ]
  },
  {
    "id": "iran-coins",
    "family": "bullion",
    "fa": "سکه بانکی ایران",
    "ar": "عملات مصرفية إيرانية",
    "en": "Iranian bank coins",
    "fr": "Pièces bancaires iraniennes",
    "types": [
      {
        "id": "iran-coins-full",
        "fa": "تمام سکه",
        "ar": "عملة كاملة",
        "en": "Full coin",
        "fr": "Pièce entière"
      },
      {
        "id": "iran-coins-half",
        "fa": "نیم سکه",
        "ar": "نصف عملة",
        "en": "Half coin",
        "fr": "Demi-pièce"
      },
      {
        "id": "iran-coins-quarter",
        "fa": "ربع سکه",
        "ar": "ربع عملة",
        "en": "Quarter coin",
        "fr": "Quart de pièce"
      },
      {
        "id": "iran-coins-gram",
        "fa": "سکه یک گرمی",
        "ar": "عملة غرام واحد",
        "en": "One-gram coin",
        "fr": "Pièce d’un gramme"
      }
    ]
  },
  {
    "id": "private-coins",
    "family": "bullion",
    "fa": "سکه / مسکوک غیربانکی",
    "ar": "مسكوكات غير مصرفية",
    "en": "Private coins",
    "fr": "Pièces privées",
    "types": [
      {
        "id": "private-coins-type",
        "fa": "سکه یا پلاک سرمایه‌ای خصوصی",
        "ar": "عملة أو لوحة استثمارية خاصة",
        "en": "Private investment coin / plaque",
        "fr": "Pièce / plaquette privée"
      }
    ]
  },
  {
    "id": "commemorative-coins",
    "family": "bullion",
    "fa": "سکه یادبود",
    "ar": "عملات تذكارية",
    "en": "Commemorative coins",
    "fr": "Pièces commémoratives",
    "types": [
      {
        "id": "commemorative-coins-type",
        "fa": "سکه یادبود طلا",
        "ar": "عملة ذهبية تذكارية",
        "en": "Gold commemorative coin",
        "fr": "Pièce commémorative en or"
      }
    ]
  },
  {
    "id": "international-coins",
    "family": "bullion",
    "fa": "سکه بین‌المللی",
    "ar": "عملات دولية",
    "en": "International coins",
    "fr": "Pièces internationales",
    "types": [
      {
        "id": "international-coins-type",
        "fa": "Bullion Coin",
        "ar": "عملة استثمارية",
        "en": "Bullion coin",
        "fr": "Pièce d’investissement"
      }
    ],
    "future": true
  },
  {
    "id": "occasion-bars",
    "family": "bullion",
    "fa": "شمش مناسبتی",
    "ar": "سبائك المناسبات",
    "en": "Occasion bars",
    "fr": "Lingots occasion",
    "types": [
      {
        "id": "occasion-bars-type",
        "fa": "Occasion Bullion",
        "ar": "سبيكة مناسبة",
        "en": "Occasion bullion",
        "fr": "Lingot occasion"
      }
    ]
  },
  {
    "id": "global-bars",
    "family": "bullion",
    "fa": "شمش برنددار جهانی",
    "ar": "سبائك علامات عالمية",
    "en": "Global branded bars",
    "fr": "Lingots de marques mondiales",
    "types": [
      {
        "id": "global-bars-type",
        "fa": "Branded Bullion",
        "ar": "سبيكة بعلامة",
        "en": "Branded bullion",
        "fr": "Lingot de marque"
      }
    ]
  },
  {
    "id": "baby-bars",
    "family": "bullion",
    "fa": "شمش کودک / نوزاد",
    "ar": "سبائك الطفل / المولود",
    "en": "Baby / kids bars",
    "fr": "Lingots bébé / enfant",
    "types": [
      {
        "id": "baby-bars-type",
        "fa": "Baby / Kids Bullion",
        "ar": "سبيكة للطفل",
        "en": "Baby / kids bullion",
        "fr": "Lingot bébé / enfant"
      }
    ]
  },
  {
    "id": "custom-bars",
    "family": "bullion",
    "fa": "شمش سفارشی",
    "ar": "سبائك مخصصة",
    "en": "Custom bars",
    "fr": "Lingots personnalisés",
    "types": [
      {
        "id": "custom-bars-type",
        "fa": "حکاکی‌شده / شخصی‌سازی",
        "ar": "منقوش / مخصص",
        "en": "Engraved / personalized",
        "fr": "Gravé / personnalisé"
      }
    ]
  },
  {
    "id": "combi-bars",
    "family": "bullion",
    "fa": "شمش ترکیبی",
    "ar": "سبائك مقسمة",
    "en": "CombiBars",
    "fr": "Lingots divisibles",
    "types": [
      {
        "id": "combi-bars-type",
        "fa": "CombiBar",
        "ar": "سبيكة مقسمة",
        "en": "CombiBar",
        "fr": "Lingot divisible"
      }
    ]
  }
] as const

export const metricBarWeights = ["0.250","0.500","1.000","2.000","2.500","5.000","10.000","20.000","50.000","100.000","250.000","500.000","1000.000"] as const
export const coinWeights: Record<string, string> = {"iran-coins-full":"8.133","iran-coins-half":"4.0665","iran-coins-quarter":"2.03225","iran-coins-gram":"1.010"}
