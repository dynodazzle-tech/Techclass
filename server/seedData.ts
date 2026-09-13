// Initial seed datasets for TechClass
export const initialSiteSettings = [
  { key: 'site_name', value: 'TechClass' },
  { key: 'brand_tagline', value: 'Your Digital Classroom for Government Exam Preparation' },
  { key: 'parent_brand', value: 'DynoDazzle' },
  { key: 'primary_domain', value: 'https://techclass.dynodazzle.in' },
  { key: 'contact_email', value: 'dynodazzle@gmail.com' },
  { key: 'whatsapp_support', value: '+91 7770032149' },
  { key: 'upi_id', value: 'techclass@upi' },
  { key: 'annual_membership_price', value: '2999' },
  { key: 'free_test_limit', value: '3' },
  { key: 'free_test_monthly_limit', value: '5' },
  { key: 'free_pdf_limit', value: '2' },
  { key: 'free_course_limit', value: '2' },
  { key: 'free_content_limit', value: '5' },
  { key: 'free_attempt_limit', value: '3' },
  { key: 'max_active_sessions', value: '2' },
  { key: 'watermark_default', value: '1' }
];

export const initialCourses = [
  {
    id: 'c1',
    title: 'MPSC Rajyaseva & Combined Prelims Comprehensive Masterclass',
    slug: 'mpsc-comprehensive-masterclass',
    description: 'Complete syllabus coverage for Maharashtra Public Service Commission exams covering General Studies, Maharashtra History, Geography, and CSAT.',
    thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=60',
    exam: 'MPSC',
    subject: 'General Studies & CSAT',
    language: 'mr',
    access_type: 'MEMBERSHIP',
    price: 2999,
    is_published: 1,
    sort_order: 1,
    modules: [
      {
        id: 'm1_1',
        title: 'Module 1: Indian Polity & Maharashtra State Administration',
        lessons: [
          { id: 'l1_1_1', title: 'Preamble, Fundamental Rights & DPSP (Overview)', duration: 45, is_free: 1, content: 'Detailed constitutional breakdown of Articles 12-51A with comparative state legislature insights.' },
          { id: 'l1_1_2', title: 'Governor Powers & Maharashtra State Council', duration: 50, is_free: 0, content: 'Constitutional positions, discretionary powers, and landmark judicial rulings.' }
        ]
      },
      {
        id: 'm1_2',
        title: 'Module 2: Maharashtra Geography & Natural Resources',
        lessons: [
          { id: 'l1_2_1', title: 'Physiography of Western Ghats & Deccan Plateau', duration: 40, is_free: 0, content: 'Geological formations, passes (ghats), river basins of Godavari, Krishna & Tapi.' }
        ]
      }
    ]
  },
  {
    id: 'c2',
    title: 'SSC CGL & CHSL 2026 Complete Tier 1 & Tier 2 Foundation',
    slug: 'ssc-cgl-tier1-tier2-foundation',
    description: 'Master Quantitative Aptitude, Logical Reasoning, General Awareness, and English Comprehension with speed tricks and previous 10-year question trends.',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60',
    exam: 'SSC',
    subject: 'Complete Quantitative & Reasoning',
    language: 'en',
    access_type: 'FREE',
    price: 0,
    is_published: 1,
    sort_order: 2,
    modules: [
      {
        id: 'm2_1',
        title: 'Module 1: Speed Arithmetic & Number Systems',
        lessons: [
          { id: 'l2_1_1', title: 'Unit Digit, Remainder Theorem & Divisibility Rules', duration: 35, is_free: 1, content: 'Fast mental computation tricks for prime factorizations and recurring decimals.' },
          { id: 'l2_1_2', title: 'Percentages, Profit & Loss with Ratio Method', duration: 55, is_free: 1, content: 'Formula-free methods to solve multi-stage discount and marked price problems.' }
        ]
      }
    ]
  },
  {
    id: 'c3',
    title: 'Maharashtra Police Bharti Mission Khaki 2026',
    slug: 'maharashtra-police-bharti-mission-khaki',
    description: 'Targeted preparation for Constable & Driver posts: Marathi Grammar, General Knowledge, Basic Mathematics, and Intellectual Test.',
    thumbnail: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&auto=format&fit=crop&q=60',
    exam: 'Police Bharti',
    subject: 'Marathi Vyakaran & GK',
    language: 'mr',
    access_type: 'MEMBERSHIP',
    price: 2999,
    is_published: 1,
    sort_order: 3,
    modules: [
      {
        id: 'm3_1',
        title: 'Module 1: संपूर्ण मराठी व्याकरण (Complete Marathi Grammar)',
        lessons: [
          { id: 'l3_1_1', title: 'वर्णविचार आणि संधी नियम', duration: 40, is_free: 1, content: 'स्वर, स्वरादी, व्यंजने आणि संधींचे प्रकार सोप्या उदाहरणांसह.' },
          { id: 'l3_1_2', title: 'प्रयोग विचार व समासांचे प्रकार', duration: 50, is_free: 0, content: 'कर्तरी, कर्मणी व भावे प्रयोगांची अचूक ओळख व १००+ सराव प्रश्न.' }
        ]
      }
    ]
  },
  {
    id: 'c4',
    title: 'UPSC Civil Services Prelims GS Paper 1 Booster',
    slug: 'upsc-civil-services-prelims-gs-paper-1',
    description: 'High-yield conceptual revision for Polity, Economy, Modern Indian History, Environment & Ecology.',
    thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=60',
    exam: 'UPSC',
    subject: 'Indian Polity & Modern History',
    language: 'en',
    access_type: 'MEMBERSHIP',
    price: 2999,
    is_published: 1,
    sort_order: 4,
    modules: [
      {
        id: 'm4_1',
        title: 'Module 1: Constitutional Framework & Governance',
        lessons: [
          { id: 'l4_1_1', title: 'Basic Structure Doctrine & Judicial Review', duration: 60, is_free: 1, content: 'Evolution from Shankari Prasad to Kesavananda Bharati case and current trends.' }
        ]
      }
    ]
  }
];

export const initialTests = [
  {
    id: 't1',
    title: 'MPSC State Services GS Paper 1 Full-Length Mock Test 01',
    description: 'Comprehensive 100-mark mock test covering Maharashtra history, Indian constitution, geography, and current affairs with tri-lingual translations.',
    type: 'MOCK',
    exam: 'MPSC',
    subject: 'General Studies',
    duration_minutes: 60,
    total_marks: 100,
    passing_percentage: 45,
    negative_marking_ratio: 0.25,
    question_count: 5,
    access_type: 'FREE',
    is_published: 1,
    questions: [
      {
        id: 'q1_1',
        question_number: 1,
        subject: 'Indian Polity',
        topic: 'Constitutional Articles',
        difficulty: 'MEDIUM',
        marks: 2,
        negative_marks: 0.5,
        correct_answer: 'B',
        translations: {
          en: {
            question: 'Under which Article of the Constitution of India can a citizen move the Supreme Court for the enforcement of Fundamental Rights?',
            opt_a: 'Article 226',
            opt_b: 'Article 32',
            opt_c: 'Article 143',
            opt_d: 'Article 356',
            explanation: 'Article 32 confers the right to constitutional remedies before the Supreme Court. Dr. B.R. Ambedkar termed it the "Heart and Soul of the Constitution". (Article 226 is for High Courts).'
          },
          hi: {
            question: 'भारतीय संविधान के किस अनुच्छेद के तहत एक नागरिक मौलिक अधिकारों के प्रवर्तन के लिए सर्वोच्च न्यायालय जा सकता है?',
            opt_a: 'अनुच्छेद 226',
            opt_b: 'अनुच्छेद 32',
            opt_c: 'अनुच्छेद 143',
            opt_d: 'अनुच्छेद 356',
            explanation: 'अनुच्छेद 32 संवैधानिक उपचारों का अधिकार प्रदान करता है। डॉ. बी.आर. अंबेडकर ने इसे संविधान का "हृदय और आत्मा" कहा था।'
          },
          mr: {
            question: 'भारतीय संविधानाच्या कोणत्या कलमान्वये नागरिकांना मूलभूत हक्कांच्या संरक्षणासाठी थेट सर्वोच्च न्यायालयात दाद मागता येते?',
            opt_a: 'कलम २२६',
            opt_b: 'कलम ३२',
            opt_c: 'कलम १४३',
            opt_d: 'कलम ३५६',
            explanation: 'कलम ३२ अन्वये घटनात्मक उपायांचा अधिकार मिळतो. डॉ. बाबासाहेब आंबेडकरांनी या कलमाला "संविधानाचा आत्मा व हृदय" म्हटले आहे. (कलम २२६ हे उच्च न्यायालयासाठी आहे).'
          }
        }
      },
      {
        id: 'q1_2',
        question_number: 2,
        subject: 'Maharashtra History',
        topic: 'Social Reformers',
        difficulty: 'MEDIUM',
        marks: 2,
        negative_marks: 0.5,
        correct_answer: 'A',
        translations: {
          en: {
            question: 'In which year did Mahatma Jyotirao Phule establish the Satyashodhak Samaj in Pune?',
            opt_a: '1873',
            opt_b: '1885',
            opt_c: '1857',
            opt_d: '1890',
            explanation: 'Satyashodhak Samaj was founded on 24 September 1873 by Mahatma Jyotirao Phule in Pune to liberate the shudras and atishudras from exploitation.'
          },
          hi: {
            question: 'महात्मा ज्योतिराव फुले ने पुणे में सत्यशोधक समाज की स्थापना किस वर्ष की थी?',
            opt_a: '1873',
            opt_b: '1885',
            opt_c: '1857',
            opt_d: '1890',
            explanation: 'सत्यशोधक समाज की स्थापना 24 सितंबर 1873 को पुणे में महात्मा ज्योतिराव फुले द्वारा की गई थी।'
          },
          mr: {
            question: 'महात्मा ज्योतिराव फुले यांनी पुणे येथे सत्यशोधक समाजाची स्थापना कोणत्या वर्षी केली?',
            opt_a: '१८७३',
            opt_b: '१८८५',
            opt_c: '१८५७',
            opt_d: '१८९०',
            explanation: '२४ सप्टेंबर १८७३ रोजी महात्मा ज्योतिराव फुले यांनी पुण्यात सत्यशोधक समाजाची स्थापना केली. त्यांचे मुख्य ध्येय बहुजन समाजाला जागृत करणे होते.'
          }
        }
      },
      {
        id: 'q1_3',
        question_number: 3,
        subject: 'Maharashtra Geography',
        topic: 'Rivers & Mountains',
        difficulty: 'HARD',
        marks: 2,
        negative_marks: 0.5,
        correct_answer: 'C',
        translations: {
          en: {
            question: 'Which of the following mountain peaks is the highest peak in Maharashtra?',
            opt_a: 'Salher',
            opt_b: 'Harishchandragad',
            opt_c: 'Kalsubai',
            opt_d: 'Mahabaleshwar',
            explanation: 'Kalsubai peak (1,646 meters / 5,400 feet) located in Ahmednagar district is the highest point in Maharashtra.'
          },
          hi: {
            question: 'निम्नलिखित में से कौन सी पर्वत चोटी महाराष्ट्र की सबसे ऊंची चोटी है?',
            opt_a: 'साल्हेर',
            opt_b: 'हरिश्चंद्रगढ़',
            opt_c: 'कलसूबाई',
            opt_d: 'महाबलेश्वर',
            explanation: 'कलसूबाई (1,646 मीटर) महाराष्ट्र का सबसे ऊँचा पर्वत शिखर है, जो अहमदनगर जिले में स्थित है।'
          },
          mr: {
            question: 'खालीलपैकी कोणते शिखर महाराष्ट्रातील सर्वोच्च पर्वतशिखर आहे?',
            opt_a: 'साल्हेर',
            opt_b: 'हरिश्चंद्रगड',
            opt_c: 'कळसूबाई',
            opt_d: 'महाबळेश्वर',
            explanation: 'कळसूबाई शिखर (१,६४६ मीटर) हे महाराष्ट्रातील सर्वात उंच शिखर असून ते अहमदनगर जिल्ह्यातील अकोले तालुक्यात आहे.'
          }
        }
      },
      {
        id: 'q1_4',
        question_number: 4,
        subject: 'General Awareness',
        topic: 'Indian Economy',
        difficulty: 'EASY',
        marks: 2,
        negative_marks: 0.5,
        correct_answer: 'B',
        translations: {
          en: {
            question: 'Which organization is responsible for formulating Monetary Policy in India?',
            opt_a: 'Ministry of Finance',
            opt_b: 'Reserve Bank of India (RBI)',
            opt_c: 'NITI Aayog',
            opt_d: 'SEBI',
            explanation: 'The Monetary Policy Committee (MPC) of the Reserve Bank of India is responsible for determining the repo rate and maintaining price stability.'
          },
          hi: {
            question: 'भारत में मौद्रिक नीति (Monetary Policy) तैयार करने के लिए कौन सा संगठन जिम्मेदार है?',
            opt_a: 'वित्त मंत्रालय',
            opt_b: 'भारतीय रिजर्व बैंक (RBI)',
            opt_c: 'नीति आयोग',
            opt_d: 'सेबी (SEBI)',
            explanation: 'भारतीय रिज़र्व बैंक (RBI) की मौद्रिक नीति समिति (MPC) रेपो दर तय करने और मुद्रास्फीति नियंत्रण के लिए उत्तरदायी है।'
          },
          mr: {
            question: 'भारतात चलनविषयक धोरण (Monetary Policy) ठरविण्याची मुख्य जबाबदारी कोणाची आहे?',
            opt_a: 'केंद्रीय अर्थमंत्रालय',
            opt_b: 'भारतीय रिझर्व्ह बँक (RBI)',
            opt_c: 'नीती आयोग',
            opt_d: 'सेबी (SEBI)',
            explanation: 'भारतीय रिझर्व्ह बँकेची (RBI) मॉनेटरी पॉलिसी कमिटी देशातील पतधोरण व रेपो दर निश्चित करते.'
          }
        }
      },
      {
        id: 'q1_5',
        question_number: 5,
        subject: 'Current Affairs',
        topic: 'Science & Technology',
        difficulty: 'MEDIUM',
        marks: 2,
        negative_marks: 0.5,
        correct_answer: 'D',
        translations: {
          en: {
            question: 'What is the designated name of the lunar landing spot of India’s Chandrayaan-3 lander?',
            opt_a: 'Tiranga Point',
            opt_b: 'Atal Point',
            opt_c: 'Kalam Sthal',
            opt_d: 'Shiv Shakti Point',
            explanation: 'The landing site of Chandrayaan-3’s Vikram lander near the lunar South Pole was officially named "Shiv Shakti Point" by the Government of India.'
          },
          hi: {
            question: 'भारत के चंद्रयान-3 लैंडर के चंद्रमा पर उतरने वाले स्थान का आधिकारिक नाम क्या रखा गया है?',
            opt_a: 'तिरंगा पॉइंट',
            opt_b: 'अटल पॉइंट',
            opt_c: 'कलाम स्थल',
            opt_d: 'शिव शक्ति पॉइंट',
            explanation: 'चंद्रयान-3 के लैंडिंग स्थल को आधिकारिक रूप से "शिव शक्ति पॉइंट" नाम दिया गया है।'
          },
          mr: {
            question: 'भारताच्या चांद्रयान-३ लँडरने चंद्रावर ज्या ठिकाणी पाऊल ठेवले त्या जागेला काय नाव देण्यात आले आहे?',
            opt_a: 'तिरंगा पॉइंट',
            opt_b: 'अटल पॉईंट',
            opt_c: 'कलाम स्थळ',
            opt_d: 'शिवशक्ती पॉईंट',
            explanation: 'चांद्रयान-३ ज्या ठिकाणी उतरले त्या जागेला केंद्र शासनाने "शिवशक्ती पॉईंट" (Shiv Shakti Point) असे नाव दिले आहे.'
          }
        }
      }
    ]
  },
  {
    id: 't2',
    title: 'SSC Reasoning & Speed Math Speed Test 2026',
    description: 'High frequency question bank for Coding-Decoding, Blood Relations, Syllogisms and Number Series.',
    type: 'PRACTICE',
    exam: 'SSC',
    subject: 'Reasoning Ability',
    duration_minutes: 30,
    total_marks: 50,
    passing_percentage: 50,
    negative_marking_ratio: 0.25,
    question_count: 2,
    access_type: 'MEMBERSHIP',
    is_published: 1,
    questions: [
      {
        id: 'q2_1',
        question_number: 1,
        subject: 'Reasoning Ability',
        topic: 'Number Series',
        difficulty: 'EASY',
        marks: 2,
        negative_marks: 0.5,
        correct_answer: 'C',
        translations: {
          en: {
            question: 'Find the next number in the series: 4, 9, 19, 39, 79, ?',
            opt_a: '149',
            opt_b: '158',
            opt_c: '159',
            opt_d: '169',
            explanation: 'The pattern is (number * 2) + 1: 4*2+1=9, 9*2+1=19, 19*2+1=39, 39*2+1=79, 79*2+1 = 159.'
          },
          hi: {
            question: 'दी गई श्रृंखला में अगला पद ज्ञात कीजिए: 4, 9, 19, 39, 79, ?',
            opt_a: '149',
            opt_b: '158',
            opt_c: '159',
            opt_d: '169',
            explanation: 'पैटर्न: (संख्या × 2) + 1 है। अतः 79 × 2 + 1 = 159.'
          },
          mr: {
            question: 'खालील संख्या मालिकेत प्रश्नचिन्हाच्या जागी कोणती संख्या येईल: 4, 9, 19, 39, 79, ?',
            opt_a: '१४९',
            opt_b: '१५८',
            opt_c: '१५९',
            opt_d: '१६९',
            explanation: 'नियम: (संख्या × २) + १ आहे. ७९ × २ + १ = १५९.'
          }
        }
      },
      {
        id: 'q2_2',
        question_number: 2,
        subject: 'Reasoning Ability',
        topic: 'Analogy',
        difficulty: 'EASY',
        marks: 2,
        negative_marks: 0.5,
        correct_answer: 'B',
        translations: {
          en: {
            question: 'Doctor : Stethoscope :: Sculptor : ?',
            opt_a: 'Anvil',
            opt_b: 'Chisel',
            opt_c: 'Brush',
            opt_d: 'Pen',
            explanation: 'A doctor uses a stethoscope as a primary diagnostic tool; a sculptor uses a chisel as their primary sculpting tool.'
          },
          hi: {
            question: 'डॉक्टर : स्टेथोस्कोप :: मूर्तिकार : ?',
            opt_a: 'निहाई',
            opt_b: 'छेनी',
            opt_c: 'ब्रश',
            opt_d: 'कलम',
            explanation: 'जिस प्रकार डॉक्टर का मुख्य उपकरण स्टेथोस्कोप है, उसी प्रकार मूर्तिकार का मुख्य औजार छेनी (Chisel) है।'
          },
          mr: {
            question: 'डॉक्टर : स्टेथॉस्कोप :: मूर्तिकार : ?',
            opt_a: 'ऐरण',
            opt_b: 'छिन्नी',
            opt_c: 'कुंचला',
            opt_d: 'पेन',
            explanation: 'ज्याप्रमाणे डॉक्टरांचे प्रमुख साधन स्टेथॉस्कोप असते, त्याचप्रमाणे मूर्तिकाराचे प्रमुख शस्त्र छिन्नी (Chisel) असते.'
          }
        }
      }
    ]
  }
];

export const initialPdfs = [
  {
    id: 'pdf1',
    title: 'Maharashtra GK & Administrative Atlas 2026',
    author: 'TechClass Exam Research Team',
    description: 'Comprehensive district-wise facts, river basins, historical forts, sanctuary locations, and census statistics prepared specifically for MPSC & Police Bharti.',
    cover_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=60',
    subject: 'Maharashtra General Knowledge',
    exam: 'MPSC / Police Bharti',
    language: 'mr',
    page_count: 12,
    file_size: '4.8 MB',
    access_type: 'FREE',
    price: 0,
    allow_download: 0,
    allow_print: 0,
    allow_copy: 0,
    watermark_enabled: 1,
    is_published: 1,
    pages: [
      {
        page_num: 1,
        title: '१. महाराष्ट्र राज्य: भौगोलिक स्थान व विस्तार',
        content: `महाराष्ट्र राज्याची स्थापना १ मे १९६० रोजी झाली. राज्याचे क्षेत्रफळ ३,०७,७१३ चौ.कि.मी. असून भारताच्या एकूण क्षेत्रफळापैकी ९.३६% क्षेत्रफळ महाराष्ट्राने व्यापले आहे.

स्थान व विस्तार:
• अक्षवृत्तीय विस्तार: १५°४४' उत्तर ते २२°६' उत्तर अक्षांश.
• रेखावृत्तीय विस्तार: ७२°३६' पूर्व ते ८०°५४' पूर्व रेखांश.
• राज्याची पूर्व-पश्चिम लांबी सुमारे ८०० कि.मी. आणि उत्तर-दक्षिण रुंदी सुमारे ७२० कि.मी. आहे.
• अरबी समुद्राची लाभलेली किनारपट्टी: ७२० कि.मी.

प्रशासकीय विभाग (६):
१. कोकण विभाग (७ जिल्हे)
२. पुणे विभाग (५ जिल्हे)
३. नाशिक विभाग (५ जिल्हे)
४. छत्रपती संभाजीनगर विभाग (८ जिल्हे)
५. अमरावती विभाग (५ जिल्हे)
६. नागपूर विभाग (६ जिल्हे)

एकूण जिल्हे: ३६ | एकूण तालुके: ३५८ (मुंबई उपनगरातील ३ धरून) | महानगरपालिका: २९.`
      },
      {
        page_num: 2,
        title: '२. महाराष्ट्रातील प्रमुख नद्या व खोरी',
        content: `१. गोदावरी नदी:
• महाराष्ट्रातील सर्वात लांब व पवित्र नदी (दक्षिण गंगा).
• उगम: त्र्यंबकेश्वर (जि. नाशिक, ब्रह्मगिरी टेकडी).
• एकूण लांबी: १,४६५ कि.मी. (महाराष्ट्रात ६६८ कि.मी.).
• गोदावरी खोऱ्याने महाराष्ट्राचे सुमारे ४९% क्षेत्र व्यापले आहे.
• प्रमुख उपनद्या: दारणा, प्रवरा, सिंदफणा, मांजरा (उजव्या बाजूने); कादवा, शिवना, दुधना, दक्षिण पूर्णा, प्राणहिता, इंद्रावती (डाव्या बाजूने).

२. भीमा नदी:
• उगम: भीमाशंकर (जि. पुणे).
• महाराष्ट्रातील लांबी: ४५१ कि.मी. (पुढे कर्नाटकात कृष्णेला मिळते).
• उजनी धरण भीमा नदीवर सोलापूर जिल्ह्यात आहे.

३. कृष्णा नदी:
• उगम: महाबळेश्वर (जि. सातारा).
• महाराष्ट्रातील लांबी: २८२ कि.मी.
• उपनद्या: कोयना (महाराष्ट्राची भाग्यरेषा), वेण्णा, वारणा, पंचगंगा, घटप्रभा.

४. तापी नदी:
• पश्चिम वाहिनी नदी. उगम: बैतुल (मध्य प्रदेश).
• महाराष्ट्रातील लांबी: २०८ कि.मी. (खानदेशातून वाहते).`
      },
      {
        page_num: 3,
        title: '३. महाराष्ट्रातील ऐतिहासिक किल्ले व पर्यटन स्थळे',
        content: `महाराष्ट्राला छत्रपती शिवाजी महाराजांचा तेजस्वी इतिहास आणि समृद्ध गडकिल्ल्यांचा वारसा लाभला आहे. युनेस्कोने महाराष्ट्रातील १२ शिवकालीन किल्ल्यांना जागतिक वारसा नामांकनात स्थान दिले आहे.

प्रमुख किल्ले:
• रायगड: मराठा साम्राज्याची राजधानी, छत्रपती शिवरायांचा राज्याभिषेक (६ जून १६७४).
• राजगड: शिवाजी महाराजांची पहिली राजधानी (२६ वर्षे).
• शिवनेरी: छत्रपती शिवाजी महाराजांचे जन्मस्थान (१९ फेब्रुवारी १६३०), जि. पुणे.
• सिंधुदुर्ग: जलदुर्ग, मालवण किनारपट्टीवर १६६४ मध्ये उभारणी.
• प्रतापगड: जावळीच्या खोऱ्यात, अफझलखान वधाची ऐतिहासिक भूमी (१० नोव्हेंबर १६५९).
• पन्हाळा: कोल्हापूर जिल्ह्यातील विस्तीर्ण किल्ला, बाजीप्रभू देशपांडे यांचा पावनखिंडीतील पराक्रम.

महत्त्वाच्या लेण्या:
• अजिंठा व वेरूळ (छत्रपती संभाजीनगर - युनेस्को जागतिक वारसा).
• कार्ले-भाजे (लोणावळा, पुणे).
• कान्हेरी लेण्या (संजय गांधी राष्ट्रीय उद्यान, मुंबई).`
      }
    ]
  },
  {
    id: 'pdf2',
    title: 'Indian Polity & Constitutional Articles Flash Notes',
    author: 'Adv. S. Ramanathan & TechClass Editorial',
    description: 'High-speed revision notes covering All Schedules, Landmark Amendments (42nd, 44th, 73rd, 86th, 101st), Fundamental Rights, and Supreme Court Judgments.',
    cover_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=60',
    subject: 'Indian Constitution & Polity',
    exam: 'UPSC / SSC / MPSC',
    language: 'en',
    page_count: 18,
    file_size: '6.2 MB',
    access_type: 'MEMBERSHIP',
    price: 2999,
    allow_download: 0,
    allow_print: 0,
    allow_copy: 0,
    watermark_enabled: 1,
    is_published: 1,
    pages: [
      {
        page_num: 1,
        title: 'Preamble & Fundamental Structure Doctrine',
        content: `The Constitution of India was adopted on 26 November 1949 and came into full effect on 26 January 1950.

Preamble Key Elements:
• Source of Authority: "WE, THE PEOPLE OF INDIA"
• Nature of Indian State: SOVEREIGN, SOCIALIST, SECULAR, DEMOCRATIC, REPUBLIC.
  (Note: "Socialist", "Secular", and "Integrity" were added by the 42nd Constitutional Amendment Act, 1976).
• Objectives: JUSTICE (Social, Economic, Political), LIBERTY (Thought, Expression, Belief, Faith, Worship), EQUALITY (Status and Opportunity), FRATERNITY (Assuring Dignity of the individual and Unity & Integrity of the Nation).

Crucial Supreme Court Landmark Judgments:
1. Berubari Union Case (1960): SC held Preamble is NOT part of the Constitution.
2. Kesavananda Bharati Case (1973): 13-judge constitutional bench overruled Berubari, holding that Preamble IS an integral part of the Constitution and established the "Basic Structure Doctrine".
3. LIC of India Case (1995): Reaffirmed Preamble is an integral part of the Constitution.`
      },
      {
        page_num: 2,
        title: 'Fundamental Rights (Articles 12 to 35) - Part III',
        content: `Referred to as the "Magna Carta of India". Fundamental Rights are justiciable in courts.

1. Right to Equality (Articles 14–18):
• Art 14: Equality before law & Equal protection of the laws.
• Art 15: Prohibition of discrimination on grounds of religion, race, caste, sex or place of birth.
• Art 16: Equality of opportunity in matters of public employment.
• Art 17: Abolition of Untouchability.
• Art 18: Abolition of Titles (except military and academic).

2. Right to Freedom (Articles 19–22):
• Art 19: Protection of 6 democratic freedoms (Speech, Assembly, Association, Movement, Residence, Profession).
• Art 20: Protection in respect of conviction for offences (No ex-post facto law, Double jeopardy, Self-incrimination).
• Art 21: Protection of Life and Personal Liberty (Maneka Gandhi case widened its scope to include right to privacy, clean environment, speedy trial).
• Art 21A: Right to Free and Compulsory Education (added by 86th Amendment Act, 2002).
• Art 22: Protection against arrest and detention in certain cases.`
      }
    ]
  },
  {
    id: 'pdf3',
    title: 'Current Affairs Compendium & Budget Highlights 2026',
    author: 'DynoDazzle EdTech Editorial Board',
    description: 'Concise review of national welfare schemes, Union Budget allocations, RBI repo rate movements, space missions, and sports honors for government job aspirants.',
    cover_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=60',
    subject: 'Current Affairs & Economy',
    exam: 'All Government Exams',
    language: 'en',
    page_count: 24,
    file_size: '5.1 MB',
    access_type: 'PAID_PURCHASE',
    price: 99,
    allow_download: 0,
    allow_print: 0,
    allow_copy: 0,
    watermark_enabled: 1,
    is_published: 1,
    pages: [
      {
        page_num: 1,
        title: 'Union Budget Key Themes & Capital Expenditure',
        content: `Major macroeconomic pillars of the latest Union Budget:
1. Capital Expenditure (Capex): Increased focus on infrastructure, railway modernizations (Vande Bharat sleeper variants), national highway logistics corridors, and green hydrogen transition.
2. Fiscal Deficit Target: Gliding path toward sub-4.5% of GDP.
3. Tax Regime Rationalization: Defaulting to the New Tax Regime with standard deduction enhancements for salaried taxpayers.
4. Agriculture & Allied Sector: Digital Public Infrastructure for Agriculture (AgriStack) rollout across states, nano-fertilizer expansion, and PM-KISAN saturation drive.

Exam Key Point:
Capital expenditure multiplier effect is estimated at 2.95x in generating economic output across core heavy sectors.`
      }
    ]
  }
];
