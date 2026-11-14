import type { Dictionary } from "./en";

// Irish UI copy: every string, so TypeScript checks it is complete and has no keys English doesn't. Needs a native
// speaker's review, the privacy policy most of all. The brand name, slogan and copyright line are the same in every
// language. The emails to the team (`quoteNotify`, `contactNotify`) are always sent from the English dictionary, so
// their Irish is here only to keep the shape complete.
export const ga: Dictionary = {
  site: {
    name: "Fiú Media",
    description: "Más fiú é a dhéanamh, is fiú é a dhéanamh i gceart.",
  },
  common: {
    loading: "Á luchtú…",
  },
  nav: {
    label: "Príomhroghchlár",
    home: "Fiú Media, leathanach baile",
    menu: "Roghchlár",
    closeMenu: "Dún an roghchlár",
    language: "Teanga",
    about: "Eolas Fúinn",
    work: "Ár gCuid Oibre",
    talent: "Tallann",
    rentals: "Cíos",
    contact: "Teagmháil",
  },
  home: {
    aboutCta: "Eolas Fúinn",
    workCta: "An obair ar fad",
  },
  slides: {
    label: "{title}, {index} as {total}",
  },
  contactLinks: {
    email: "Ríomhphost",
    instagram: "Instagram",
  },
  notFound: {
    eyebrow: "404",
    heading: "Níor aimsíodh an leathanach",
    body: "Níl an leathanach sin ann, nó tá sé bogtha.",
    home: "Ar ais abhaile",
    backTo: "Ar ais chuig {section}",
  },
  footer: {
    copyright: "Fiú Media © {year}",
    privacy: "Príobháideachas",
  },
  vimeo: {
    play: "Seinn",
    playTitle: "Seinn {title}",
    stop: "Stad an físeán",
  },
  privacy: {
    title: "Príobháideachas",
    updated: "Nuashonrú deireanach: {date}",
    intro:
      "Míníonn an leathanach seo cé na sonraí pearsanta a bhailíonn an suíomh gréasáin seo, cén fáth, cé a láimhseálann iad dúinn, agus cad iad do chearta. Is beag a bhailímid, agus ní úsáidimid fianáin fógraíochta ná rianaithe.",
    who: {
      heading: "Cé muid féin",
      body: "Is é Fiu Media Limited, ag trádáil mar Fiú Media, a reáchtálann an suíomh gréasáin seo. Is cuideachta phríobháideach é atá cláraithe in Éirinn. Is é Fiu Media Limited rialaitheoir na sonraí pearsanta a ndéantar cur síos orthu ar an leathanach seo, rud a chiallaíonn gurb sinne a chinneann conas agus cén fáth a n-úsáidtear iad.",
    },
    collect: {
      heading: "Cad a bhailímid",
      body: "An méid a sheolann tú chugainn tríd an bhfoirm teagmhála, agus sin amháin:",
      items: [
        "d'ainm agus do sheoladh ríomhphoist, agus d'uimhir fóin má thugann tú í",
        "cad faoi a bhfuil d'fhiosrúchán (tionscadal, tallann, cíos nó eile)",
        "an teachtaireacht a scríobhann tú",
      ],
    },
    why: {
      heading: "Cén fáth a n-úsáidimid iad",
      paragraphs: [
        "Chun d'fhiosrúchán a léamh agus a fhreagairt, agus chun taifead de a choinneáil. Seolaimid deimhniú chugat ar ríomhphost den mhéid a sheol tú. Ní úsáidimid do shonraí le haghaidh margaíochta ná nuachtlitreacha, agus ní dhíolaimid iad ná ní roinnimid iad le haon duine eile lena n-úsáid féin.",
        "Is é an bunús dlí ár leas dlisteanach freagra a thabhairt ar dhaoine a dhéanann teagmháil linn, agus, nuair is faoi obair nó faoi chíos atá tú ag fiafraí, céimeanna a ghlacadh ar d'iarratas sula ndéantar conradh.",
      ],
    },
    providers: {
      heading: "Cé a láimhseálann iad dúinn",
      body: "Úsáidimid roinnt seirbhísí chun an suíomh a reáchtáil. Ní phróiseálann siad sonraí ach thar ár gceann. Téann gach nasc thíos chuig an gcuid dá mbeartas a bhaineann le cuairteoirí ar shuíomh cosúil lenár suíomh féin, ní le daoine a bhfuil cuntas acu ar a n-ardán.",
      items: [
        {
          name: "Sanity",
          purpose: "Stórálann sé na fiosrúcháin a sheolann tú, agus ábhar an tsuímh seo.",
          links: [
            {
              label: "Beartas príobháideachais (féach “Information within content owned by our users”)",
              href: "https://www.sanity.io/legal/privacy",
            },
          ],
        },
        {
          name: "Resend",
          purpose:
            "Seolann sé ár ríomhphoist (an fógra chugainne agus an deimhniú chugatsa) agus coinníonn sé d'ainm, do sheoladh ríomhphoist agus d'uimhir fóin mar thaifead teagmhála. Níl tú cláraithe le haon rud.",
          links: [
            {
              label: "Aguisín próiseála sonraí (clúdaíonn sé na daoine a dtéann ár ríomhphoist chucu)",
              href: "https://resend.com/legal/dpa",
            },
          ],
        },
        {
          name: "Vercel",
          purpose:
            "Óstálann sé an suíomh, mar sin láimhseálann sé seoladh IP gach iarratais. Seiceálann sé freisin gur duine, seachas bota, a sheolann foirmeacha, agus tomhaiseann sé amharcanna leathanaigh agus luas lódála gan fianáin. Ní aithníonn a anailísíocht cuairteoirí óna chéile ach trí haiseáil den iarratas, a scriosann sé tar éis 24 uair an chloig.",
          links: [
            { label: "Príobháideachas Web Analytics", href: "https://vercel.com/docs/analytics/privacy-policy" },
            { label: "Príobháideachas Speed Insights", href: "https://vercel.com/docs/speed-insights/privacy-policy" },
            { label: "Conas a sheiceálann BotID cuairteoirí", href: "https://vercel.com/docs/botid" },
          ],
        },
        {
          name: "Vimeo",
          purpose:
            "Seinneann sé ár scannáin agus na réamhamhairc ghearra díobh. Iarraimid ar Vimeo gan tú a rianú, agus ansin cuireann sé bac ar a shonraí seisiúin agus ar a anailísíocht. Ceanglaíonn do bhrabhsálaí le Vimeo fós nuair a lódálann scannán nó réamhamharc, agus socraíonn Vimeo roinnt fianán slándála (liostaithe thíos).",
          links: [
            { label: "Fianáin an tseinnteora", href: "https://help.vimeo.com/hc/en-us/articles/26080940921361" },
            { label: "Beartas príobháideachais", href: "https://vimeo.com/privacy" },
          ],
        },
      ],
    },
    storage: {
      heading: "Fianáin agus stóráil logánta",
      body: "Ní úsáidtear aon rud anseo le haghaidh fógraíochta ná chun tú a leanúint ó shuíomh go suíomh. Stórálann an suíomh na rudaí seo i do bhrabhsálaí:",
      ours: "Socraithe ag an suíomh seo",
      theirs: "Socraithe ag Vimeo, ach amháin nuair a lódálann scannán nó réamhamharc",
      items: [
        {
          name: "fiu-lang",
          type: "Fianán",
          lasts: "Coinnítear ar feadh bliana",
          description:
            "Cuimhníonn sé ar an teanga a roghnaigh tú leis an malartóir teanga. Ní shocraítear é go dtí go roghnaíonn tú ceann.",
        },
        {
          name: "fiu:logo-tier:v2",
          type: "Stóráil logánta",
          lasts: "Coinnítear ar feadh 7 lá",
          description:
            "Tugann sé faoi deara go raibh do ghléas rómhall don lógó 3D, ionas go bhfágtar ar lár é an chéad chuairt eile. Ní shocraítear é ach má tharlaíonn sé sin.",
        },
      ],
      vimeoItems: [
        {
          name: "player_clearance",
          type: "Fianán",
          lasts: "Coinnítear ar feadh 7 lá",
          description: "Cosc Vimeo ar bhotaí.",
        },
        {
          name: "cf_clearance",
          type: "Fianán",
          lasts: "Coinnítear ar feadh bliana",
          description: "Cosc Cloudflare ar bhotaí, do Vimeo.",
        },
        {
          name: "_cf_bm",
          type: "Fianán",
          lasts: "Coinnítear ar feadh 30 nóiméad",
          description: "Bainisteoir botaí Cloudflare, do Vimeo.",
        },
        {
          name: "_cfuvid",
          type: "Fianán",
          lasts: "Go dtí go ndúnann tú do bhrabhsálaí",
          description: "Teorannú ráta Cloudflare, do Vimeo.",
        },
      ],
    },
    retention: {
      heading: "Cé chomh fada a choinnímid iad",
      body: "Coinnímid fiosrúchán ar feadh 24 mhí tar éis an uair dheireanach a chualamar uait, agus ansin scriosaimid é. Is féidir leat iarraidh orainn é a scriosadh níos luaithe, agus déanfaimid é sin laistigh de mhí amháin.",
      records:
        "Má eascraíonn obair nó cíos as fiosrúchán, is taifid ghnó iad na sonraisc agus na conarthaí a leanann as, agus coinnímid iad sin ar feadh na sé bliana a éilíonn dlí cuideachta agus cánach na hÉireann.",
      providersBody:
        "Nuair a scriosaimid rud éigin, féadfaidh cóipeanna fanacht i gcórais ár soláthraithe go dtí go n-éagann siad as a stuaim féin. Seo an fad:",
      items: [
        {
          name: "Sanity",
          text: "Baintear fiosrúcháin scriosta as a stair nuair a scriosaimid iad, ach féadfaidh cóipeanna fanacht ina bhonneagar néil ar feadh suas le 180 lá.",
        },
        {
          name: "Resend",
          text: "Coinníonn sé na ríomhphoist a sheol sé dúinn, a n-ábhar san áireamh, ar feadh thart ar 30 lá.",
        },
        {
          name: "Vercel",
          text: "Coinníonn sé logaí freastalaí an tsuímh ar feadh thart ar lá, agus a staitisticí anaithnide ar amharcanna leathanaigh ar feadh thart ar 12 mhí.",
        },
        {
          name: "Ár ríomhphost féin",
          text: "Scriostar cóipeanna d'fhiosrúcháin inár mbosca poist ag an marc céanna 24 mhí.",
        },
      ],
    },
    transfers: {
      heading: "Lasmuigh den AE",
      body: "Tá roinnt de na seirbhísí thuas lonnaithe lasmuigh den Limistéar Eorpach Eacnamaíoch, nó tá foireann agus freastalaithe acu ann. Tá siad freagrach as na sonraí a láimhseálann siad a chosaint faoina dtéarmaí féin agus faoi na coimircí a éilíonn an dlí.",
    },
    rights: {
      heading: "Do chearta",
      body: "Is féidir leat iarraidh orainn na sonraí atá againn fút a thaispeáint duit, iad a cheartú, iad a scriosadh, nó srian a chur ar an gcaoi a n-úsáidimid iad nó stop a chur leis, agus is féidir leat cóip a iarraidh le tabhairt áit eile. Is féidir leat agóid a dhéanamh freisin in aghaidh ár n-úsáide díobh.",
      complaint:
        "Mura bhfuil tú sásta leis an gcaoi ar láimhseálamar do shonraí, is féidir leat gearán a dhéanamh leis an {authority}, údarás cosanta sonraí na hÉireann. Má chónaíonn tú i dtír eile san AE, is féidir leat gearán a dhéanamh freisin le húdarás cosanta sonraí do thíre féin.",
      // Eclipsed, as it reads after "leis an" in `complaint`, the only place it appears.
      authority: "gCoimisiún um Chosaint Sonraí",
    },
    contactHeading: "Déan teagmháil linn",
    contactBody:
      "Chun aon cheann de na cearta seo a úsáid, nó chun aon rud a fhiafraí dínn faoin leathanach seo, déan teagmháil linn:",
    contactForm: "Úsáid an fhoirm teagmhála",
    opensInNewTab: "osclaíonn sé i gcluaisín nua",
  },
  about: {
    title: "Eolas Fúinn",
    teamHeading: "An Fhoireann",
  },
  work: {
    title: "Ár gCuid Oibre",
    filterLabel: "Scag de réir cineál tionscadail",
    all: "Uile",
    empty: "Níl aon tionscadal den chineál seo ann go fóill.",
    emptyAll: "Táimid ag cur lenár gcuid oibre. Féach arís go luath.",
    credits: "Creidiúintí",
    stills: "Grianghraif",
    openStill: "Féach ar ghrianghraf {n} as {total}",
    closeStill: "Dún",
    previousStill: "An grianghraf roimhe",
    nextStill: "An chéad ghrianghraf eile",
    stillCounter: "{n} as {total}",
    next: "An chéad tionscadal eile",
    back: "An obair ar fad",
    view: "Féach ar an tionscadal",
    progressLabel: "Tionscadail",
    goTo: "Téigh go {title}",
  },
  talent: {
    title: "Tallann",
    empty: "Táimid ag nuashonrú ár liosta tallainne.",
    indexLabel: "Ár dtallann",
    showreel: "Ríl taispeána",
    projects: "Tionscadail",
    projectsOf: "Obair {name}",
    noPortrait: "Portráid le teacht go luath",
    back: "An tallann ar fad",
  },
  rentals: {
    title: "Cíos Trealaimh",
    filterLabel: "Scag de réir catagóire",
    allCategories: "Uile",
    empty: "Níl aon rud sa chatagóir seo go fóill.",
    emptyCatalogue:
      "Táimid ag nuashonrú ár liosta trealaimh. Déan teagmháil linn agus cabhróimid leat leis an trealamh atá uait.",
    addToQuote: "Cuir leis an luacháil",
    inQuote: "Sa luacháil ({qty})",
    maxReached: "An uasmhéid sa luacháil",
    available: "{max} ar fáil",
    viewDetails: "Sonraí",
    backToRentals: "An cíos ar fad",
    noImage: "Grianghraf le teacht go luath",
    galleryLabel: "Grianghraif de {name}",
    largePhoto: "Grianghraf mór",
    showImage: "Taispeáin grianghraf {n} as {total}",
    photoOf: "Grianghraf {n} as {total}",
    previousImage: "An grianghraf roimhe",
    nextImage: "An chéad ghrianghraf eile",
    keyFeatures: "Príomhghnéithe",
    specs: "Sonraíochtaí",
    includedInKit: "San áireamh sa phacáiste",
    quantity: "Cainníocht",
    fewer: "Ceann amháin níos lú",
    more: "Ceann amháin eile",
    notFoundTitle: "Earra cíosa",
  },
  basket: {
    open: "Oscail an bascaed luachála",
    openWithCount:
      "Oscail an bascaed luachála, {count, plural, one {# earra} two {# earra} few {# earra} many {# n-earra} other {# earra}} sa luacháil",
    title: "Do luacháil",
    empty: "Tá do luacháil folamh. Cuir trealamh leis ón gcatalóg.",
    close: "Dún an bascaed luachála",
    review: "Athbhreithnigh agus seol",
    remove: "Bain {name}",
    increase: "Cuir ceann eile de {name} leis",
    decrease: "Bain ceann de {name}",
    quantityOf: "Cainníocht {name}",
    unknownItem: "Níl an t-earra seo ar fáil a thuilleadh",
  },
  quote: {
    title: "Iarr luacháil",
    itemsHeading: "Do threalamh",
    emptyBasket: "Tá do luacháil folamh.",
    browse: "Brabhsáil an cíos",
    datesHeading: "Dátaí an chíosa",
    startDate: "Bailiú",
    endDate: "Tabhairt ar ais",
    contactHeading: "Do shonraí",
    company: "Cuideachta",
    production: "Léiriúchán",
    message: "An bhfuil aon rud eile ar cheart dúinn a bheith ar an eolas faoi?",
    copyLink: "Cóipeáil an nasc",
    shareLink: "Roinn an nasc",
    shareTitle: "Luacháil ó Fiú Media",
    linkCopied: "Nasc cóipeáilte",
    linkCopyFailed: "Níorbh fhéidir cóipeáil go huathoibríoch. Cóipeáil an nasc seo:",
    copyLinkHint: "Tá an trealamh, na dátaí, an chuideachta agus an léiriúchán sa nasc, ach níl do shonraí teagmhála ann.",
    placeholders: {
      company: "Pictiúir Uí Mhurchú",
      production: "Teideal oibre na scannánaíochta",
      message: "Suíomh, méid na foirne, aon rud a théann i bhfeidhm ar an trealamh",
    },
    submit: "Seol an t-iarratas ar luacháil",
    successTitle: "Iarratas seolta",
    successBody:
      "Go raibh maith agat, fuaireamar d'iarratas ar luacháil agus sheolamar deimhniú chuig do ríomhphost. Beimid i dteagmháil go luath.",
    successBodyNoEmail:
      "Go raibh maith agat, fuaireamar d'iarratas ar luacháil. Ní féidir linn deimhniú a sheoladh chuig an seoladh sin, ach beimid i dteagmháil go luath.",
    successAction: "Ar ais go dtí an cíos",
  },
  contact: {
    title: "Teagmháil",
    enquiryType: "Cad atá i gceist?",
    enquiryTypes: { Project: "Tionscadal", Talent: "Ár dtallann", Rentals: "Cíos trealaimh", Other: "Rud éigin eile" },
    message: "Teachtaireacht",
    placeholders: {
      message: "Inis dúinn faoi do thionscadal, nó faoin rud atá uait",
    },
    submit: "Seol an teachtaireacht",
    successTitle: "Teachtaireacht seolta",
    successBody:
      "Go raibh maith agat as dul i dteagmháil linn. Sheolamar cóip chuig do ríomhphost, agus freagróimid chomh luath agus is féidir linn.",
    successBodyNoEmail:
      "Go raibh maith agat as dul i dteagmháil linn. Ní féidir linn cóip a sheoladh chuig an seoladh sin, ach freagróimid chomh luath agus is féidir linn.",
    directHeading: "Nó déan teagmháil linn go díreach",
  },
  forms: {
    fields: {
      name: "Ainm",
      email: "Ríomhphost",
      phone: "Fón",
      phoneCountry: "Tír na huimhreach fóin",
      optional: "roghnach",
      sending: "Á sheoladh…",
      placeholders: {
        name: "Aoife Ní Mhurchú",
        // The same example address as `errors.emailInvalid`; example.com is reserved for examples.
        email: "name@example.com",
      },
    },
    errorSummary: "Seiceáil na réimsí aibhsithe, le do thoil",
    errors: {
      required: "Tá an réimse seo riachtanach.",
      invalid: "Seiceáil an luach seo, le do thoil.",
      emailInvalid: "Cuir isteach seoladh ríomhphoist mar name@example.com.",
      phoneInvalid: "Cuir isteach uimhir fhóin bhailí don tír roghnaithe.",
      dateInvalid: "Roghnaigh dáta.",
      tooLong: "Tá sé sin rófhada. Giorraigh é, le do thoil.",
      empty: "Cuir earra amháin ar a laghad le do luacháil.",
      beforeStart: "Caithfidh an dáta tabhairt ar ais a bheith ar an dáta bailithe nó ina dhiaidh.",
      past: "Ní féidir leis an dáta bailithe a bheith san am atá caite.",
      tooFar: "Ní féidir leis an dáta bailithe a bheith níos mó ná dhá bhliain amach.",
      hireTooLong:
        "Ní féidir cíos a bheith níos faide ná bliain amháin. Le haghaidh cíosanna níos faide, seol ríomhphost chugainn.",
      overLimit:
        "Tá roinnt cainníochtaí os cionn an uasmhéid is féidir linn a thairiscint. Athbhreithnigh na cainníochtaí i do luacháil, le do thoil.",
      unavailable:
        "Níl roinnt earraí i do luacháil ar fáil a thuilleadh. Bain na cinn atá marcáilte thíos agus bain triail eile as.",
      rejected: "Níorbh fhéidir linn an t-iarratas seo a fhíorú. Bain triail eile as, le do thoil.",
      failed: "Tharla earráid ar ár dtaobh-ne. Bain triail eile as, nó seol ríomhphost chugainn go díreach.",
    },
  },
  dates: {
    dayOne: "{count} lá",
    dayMany: "{count} lá",
    rangeSummary: "{range} · {duration}",
  },
  emails: {
    quoteNotify: {
      subject:
        "Iarratas ar luacháil ó {name} ({count, plural, one {# earra} two {# earra} few {# earra} many {# n-earra} other {# earra}} sa luacháil)",
      heading: "Iarratas nua ar luacháil",
      openInStudio: "Oscail in Studio",
    },
    quoteConfirm: {
      subject: "Fuaireamar d'iarratas ar luacháil",
      heading: "Go raibh maith agat, fuaireamar d'iarratas",
      body: "Seo an méid a d'iarr tú. Freagróimid le heolas ar infhaighteacht agus le luacháil.",
      signoff: "Fiú Media",
    },
    contactConfirm: {
      subject: "Fuaireamar do theachtaireacht",
      heading: "Go raibh maith agat, fuaireamar do theachtaireacht",
      body: "Seo cóip den mhéid a sheol tú. Freagróimid chomh luath agus is féidir linn.",
      signoff: "Fiú Media",
    },
    contactNotify: {
      subject: "Fiosrúchán ({type}) ó {name}",
      heading: "Teachtaireacht nua",
      openInStudio: "Oscail in Studio",
    },
    labels: {
      name: "Ainm",
      email: "Ríomhphost",
      phone: "Fón",
      company: "Cuideachta",
      production: "Léiriúchán",
      dates: "Dátaí",
      kit: "Trealamh",
      message: "Teachtaireacht",
      enquiryType: "Cineál fiosrúcháin",
    },
  },
};
