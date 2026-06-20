require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');
const app = express();
app.use(express.json());

//  {
//     id: 1,
//     // خيارات الإجابات ثابتة ومحايدة تناسب الجنسين
//     options: [
//       "أوافق فوراً وأبدأ بالتنفيذ",
//       "أطلب مهلة للتفكير ودراسة المخاطر",
//       "أرفض العرض تماماً"
//     ],
//     correct_index: 1,

//     // تخصيص النصوص حسب الجنس مع وضع التاج [Fname]
//     localized_content: {
//       male: {
//         challenge: "يا سيد [Fname]، تخيل أنك في اجتماع مصيري وعُرضت عليك صفقة تبدو مربحة جداً لكنها غامضة، ما هو تصرفك الذكي؟",
//         explanations: {
//           a: "تسرعك يا [Fname] قد يكلفك الكثير، الذكاء المالي يتطلب الحذر.",
//           b: "أحييك يا [Fname]! هذا هو التصرف الاحترافي، التروي أساس النجاح المالي.",
//           c: "الرفض القاطع بدون دراسة قد يضيع عليك فرصاً ذهبية يا [Fname]."
//         }
//       },
//       female: {
//         challenge: "يا عزيزتي [Fname]، تخيلي أنكِ في اجتماع مصيري وعُرضت عليكِ صفقة تبدو مربحة جداً لكنها غامضة، ما هو تصرفكِ الذكي؟",
//         explanations: {
//           a: "تسرعكِ يا [Fname] قد يكلفكِ الكثير، الذكاء المالي يتطلب الحذر دائماً.",
//           b: "أحييكِ يا [Fname]! هذا هو التصرف الاحترافي، التروي أساس النجاح المالي للنخبة.",
//           c: "الرفض القاطع بدون دراسة قد يضيع عليكِ فرصاً ذهبية يا [Fname]."
//         }
//       }
//     }
//   },
// 📦 قاعدة البيانات الثابتة (امتلأها يومياً بمواقف الثقافة العامة المشوقة)
// تأكد من أن كل موقف تضعه يحمل معرف ID تصاعدي (1، 2، 3، 4...)
const english = [
  {
  id: 1,
  options: [
    "أقول: I goed to school yesterday",
    "أقول: I went to school yesterday",
    "أقول: I go to school yesterday"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أنت تتحدث عن الماضي بالإنجليزية، أي جملة تعتبر صحيحة Grammar؟",
      explanations: {
        a: "قريب يا [Fname]، لكن الفعل go في الماضي يصبح went وليس goed.",
        b: "ممتاز يا [Fname]! استخدمت Past Simple بشكل صحيح، وهذا من أهم أساسيات الإنجليزية.",
        c: "الجملة غير صحيحة يا [Fname] لأن yesterday تحتاج فعلاً في الماضي."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أنتِ تتحدثين عن الماضي بالإنجليزية، أي جملة تعتبر صحيحة Grammar؟",
      explanations: {
        a: "قريب يا [Fname]، لكن الفعل go في الماضي يصبح went وليس goed.",
        b: "ممتاز يا [Fname]! استخدمتِ Past Simple بشكل صحيح، وهذا من أهم أساسيات الإنجليزية.",
        c: "الجملة غير صحيحة يا [Fname] لأن yesterday تحتاج فعلاً في الماضي."
      }
    }
  }
},

{
  id: 2,
  options: [
    "Book",
    "Apple",
    "Run"
  ],
  correct_index: 2,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أي كلمة من هذه تعتبر Verb (فعل) في اللغة الإنجليزية؟",
      explanations: {
        a: "Book تعني كتاب يا [Fname] وهي Noun وليست فعلاً هنا.",
        b: "Apple تعني تفاحة يا [Fname] وهي اسم وليست فعلاً.",
        c: "رائع يا [Fname]! Run تعني يجري وهي فعل مهم وشائع جداً."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أي كلمة من هذه تعتبر Verb (فعل) في اللغة الإنجليزية؟",
      explanations: {
        a: "Book تعني كتاب يا [Fname] وهي Noun وليست فعلاً هنا.",
        b: "Apple تعني تفاحة يا [Fname] وهي اسم وليست فعلاً.",
        c: "رائع يا [Fname]! Run تعني يجري وهي فعل مهم وشائع جداً."
      }
    }
  }
},

{
  id: 3,
  options: [
    "I am hungry",
    "I hungry",
    "Me hungry"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، إذا كنت جائعاً، ما هي الجملة الصحيحة بالإنجليزية؟",
      explanations: {
        a: "ممتاز يا [Fname]! استخدمت فعل to be بشكل صحيح.",
        b: "الجملة ناقصة يا [Fname] لأنك تحتاج الفعل am.",
        c: "هذه ليست صياغة صحيحة في الإنجليزية الرسمية يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، إذا كنتِ جائعة، ما هي الجملة الصحيحة بالإنجليزية؟",
      explanations: {
        a: "ممتاز يا [Fname]! استخدمتِ فعل to be بشكل صحيح.",
        b: "الجملة ناقصة يا [Fname] لأنكِ تحتاجين الفعل am.",
        c: "هذه ليست صياغة صحيحة في الإنجليزية الرسمية يا [Fname]."
      }
    }
  }
},

{
  id: 4,
  options: [
    "Beautiful",
    "Quickly",
    "Teacher"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أي كلمة من هذه تعتبر Adverb (حال)؟",
      explanations: {
        a: "Beautiful صفة يا [Fname] وليست حالاً.",
        b: "أحسنت يا [Fname]! Quickly تعني بسرعة وهي Adverb.",
        c: "Teacher اسم شخص يا [Fname] وليس Adverb."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أي كلمة من هذه تعتبر Adverb (حال)؟",
      explanations: {
        a: "Beautiful صفة يا [Fname] وليست حالاً.",
        b: "أحسنتِ يا [Fname]! Quickly تعني بسرعة وهي Adverb.",
        c: "Teacher اسم شخص يا [Fname] وليس Adverb."
      }
    }
  }
},

{
  id: 5,
  options: [
    "She don't like coffee",
    "She doesn't like coffee",
    "She not like coffee"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، اختر الجملة الصحيحة في Present Simple.",
      explanations: {
        a: "قريب يا [Fname]، لكن مع She نستخدم doesn't.",
        b: "رائع يا [Fname]! هذه جملة صحيحة 100% في القواعد.",
        c: "الجملة ناقصة قواعدياً يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، اختاري الجملة الصحيحة في Present Simple.",
      explanations: {
        a: "قريب يا [Fname]، لكن مع She نستخدم doesn't.",
        b: "رائع يا [Fname]! هذه جملة صحيحة 100% في القواعد.",
        c: "الجملة ناقصة قواعدياً يا [Fname]."
      }
    }
  }
},

{
  id: 6,
  options: [
    "Hospital = مدرسة",
    "Hospital = مستشفى",
    "Hospital = مطعم"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، ما معنى كلمة Hospital بالإنجليزية؟",
      explanations: {
        a: "ليس صحيحاً يا [Fname]، مدرسة تعني School.",
        b: "ممتاز يا [Fname]! Hospital تعني مستشفى وهي كلمة أساسية جداً.",
        c: "مطعم يعني Restaurant يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، ما معنى كلمة Hospital بالإنجليزية؟",
      explanations: {
        a: "ليس صحيحاً يا [Fname]، مدرسة تعني School.",
        b: "ممتاز يا [Fname]! Hospital تعني مستشفى وهي كلمة أساسية جداً.",
        c: "مطعم يعني Restaurant يا [Fname]."
      }
    }
  }
},

{
  id: 7,
  options: [
    "Can you help me?",
    "You can help me?",
    "Help me can you?"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أنت في الشارع وتريد طلب المساعدة بالإنجليزية بطريقة مهذبة، ماذا تقول؟",
      explanations: {
        a: "ممتاز يا [Fname]! هذه طريقة مهذبة وطبيعية لطلب المساعدة.",
        b: "الجملة مفهومة لكن ترتيبها ليس الأفضل يا [Fname].",
        c: "الترتيب غير صحيح في السؤال الإنجليزي يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أنتِ في الشارع وتريدين طلب المساعدة بالإنجليزية بطريقة مهذبة، ماذا تقولين؟",
      explanations: {
        a: "ممتاز يا [Fname]! هذه طريقة مهذبة وطبيعية لطلب المساعدة.",
        b: "الجملة مفهومة لكن ترتيبها ليس الأفضل يا [Fname].",
        c: "الترتيب غير صحيح في السؤال الإنجليزي يا [Fname]."
      }
    }
  }
},

{
  id: 8,
  options: [
    "Big",
    "Huge",
    "Small"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أي كلمة تعتبر أقوى وأكثر تقدماً من كلمة Big؟",
      explanations: {
        a: "Big جيدة يا [Fname] لكنها ليست الأقوى هنا.",
        b: "رائع يا [Fname]! Huge تعني ضخم جداً وتجعلك تبدو أكثر احترافية في الإنجليزية.",
        c: "Small تعني صغير وهي عكس Big يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أي كلمة تعتبر أقوى وأكثر تقدماً من كلمة Big؟",
      explanations: {
        a: "Big جيدة يا [Fname] لكنها ليست الأقوى هنا.",
        b: "رائع يا [Fname]! Huge تعني ضخم جداً وتجعلكِ تبدين أكثر احترافية في الإنجليزية.",
        c: "Small تعني صغير وهي عكس Big يا [Fname]."
      }
    }
  },
  
},
{
  id: 9,
  options: [
    "I have been studying English for two years",
    "I am studying English since two years",
    "I study English from two years"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أنت في Interview وتريد أن تشرح أنك تتعلم الإنجليزية منذ سنتين، أي جملة احترافية وصحيحة؟",
      explanations: {
        a: "ممتاز يا [Fname]! استخدمت Present Perfect Continuous بطريقة احترافية جداً.",
        b: "قريب يا [Fname]، لكن since و for لا يُستخدمان هكذا مع هذا الزمن.",
        c: "الجملة غير صحيحة قواعدياً يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أنتِ في Interview وتريدين أن تشرحي أنكِ تتعلمين الإنجليزية منذ سنتين، أي جملة احترافية وصحيحة؟",
      explanations: {
        a: "ممتاز يا [Fname]! استخدمتِ Present Perfect Continuous بطريقة احترافية جداً.",
        b: "قريب يا [Fname]، لكن since و for لا يُستخدمان هكذا مع هذا الزمن.",
        c: "الجملة غير صحيحة قواعدياً يا [Fname]."
      }
    }
  }
},

{
  id: 10,
  options: [
    "Cheap",
    "Affordable",
    "Broken"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أنت تشرح لصديق أن هاتفاً سعره جيد وليس غالياً، أي كلمة تبدو أكثر احترافية من Cheap؟",
      explanations: {
        a: "Cheap مفهومة يا [Fname] لكنها أحياناً تعطي معنى جودة ضعيفة.",
        b: "رائع يا [Fname]! Affordable من الكلمات القوية والمستخدمة كثيراً في الحياة والعمل.",
        c: "Broken تعني مكسور يا [Fname] وليس رخيصاً."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أنتِ تشرحين لصديقة أن هاتفاً سعره جيد وليس غالياً، أي كلمة تبدو أكثر احترافية من Cheap؟",
      explanations: {
        a: "Cheap مفهومة يا [Fname] لكنها أحياناً تعطي معنى جودة ضعيفة.",
        b: "رائع يا [Fname]! Affordable من الكلمات القوية والمستخدمة كثيراً في الحياة والعمل.",
        c: "Broken تعني مكسور يا [Fname] وليس رخيصاً."
      }
    }
  }
},

{
  id: 11,
  options: [
    "I look forward to meet you",
    "I look forward to meeting you",
    "I look forward meet you"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أنت تكتب Email رسمي بالإنجليزية، كيف تكتب جملة 'أتطلع للقائك' بشكل صحيح؟",
      explanations: {
        a: "قريب يا [Fname]، لكن بعد to هنا نستخدم Verb + ing.",
        b: "أحسنت يا [Fname]! هذه من أشهر الجمل الرسمية في Emails الإنجليزية.",
        c: "الجملة ناقصة قواعدياً يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أنتِ تكتبين Email رسمي بالإنجليزية، كيف تكتبين جملة 'أتطلع للقائك' بشكل صحيح؟",
      explanations: {
        a: "قريب يا [Fname]، لكن بعد to هنا نستخدم Verb + ing.",
        b: "أحسنتِ يا [Fname]! هذه من أشهر الجمل الرسمية في Emails الإنجليزية.",
        c: "الجملة ناقصة قواعدياً يا [Fname]."
      }
    }
  }
},

{
  id: 12,
  options: [
    "Take off",
    "Give up",
    "Wake up"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، صديقك قال: 'Never give up'. ماذا يعني هذا الـ Phrasal Verb؟",
      explanations: {
        a: "Take off يعني يقلع أو يخلع يا [Fname].",
        b: "ممتاز يا [Fname]! Give up تعني يستسلم، وهي من أهم الـ Phrasal Verbs.",
        c: "Wake up تعني يستيقظ يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، صديقتك قالت: 'Never give up'. ماذا يعني هذا الـ Phrasal Verb؟",
      explanations: {
        a: "Take off يعني يقلع أو يخلع يا [Fname].",
        b: "ممتاز يا [Fname]! Give up تعني يستسلم، وهي من أهم الـ Phrasal Verbs.",
        c: "Wake up تعني يستيقظ يا [Fname]."
      }
    }
  }
},

{
  id: 13,
  options: [
    "I am interested in learning English",
    "I am interested to learn English",
    "I interested in learning English"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أثناء التعارف بالإنجليزية، أي جملة تعتبر طبيعية وصحيحة للتعبير عن اهتمامك بتعلم الإنجليزية؟",
      explanations: {
        a: "رائع يا [Fname]! بعد interested in نستخدم Verb + ing.",
        b: "خطأ شائع يا [Fname]، هذه الصياغة ليست الأفضل هنا.",
        c: "الجملة ناقصة لأن فعل to be غير موجود يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أثناء التعارف بالإنجليزية، أي جملة تعتبر طبيعية وصحيحة للتعبير عن اهتمامكِ بتعلم الإنجليزية؟",
      explanations: {
        a: "رائع يا [Fname]! بعد interested in نستخدم Verb + ing.",
        b: "خطأ شائع يا [Fname]، هذه الصياغة ليست الأفضل هنا.",
        c: "الجملة ناقصة لأن فعل to be غير موجود يا [Fname]."
      }
    }
  }
},

{
  id: 14,
  options: [
    "Exhausted",
    "Happy",
    "Tiny"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، بعد يوم طويل من العمل والدراسة، أي كلمة متقدمة تعني 'متعب جداً'؟",
      explanations: {
        a: "ممتاز يا [Fname]! Exhausted من الكلمات القوية والمستخدمة كثيراً في الحياة اليومية.",
        b: "Happy تعني سعيد يا [Fname].",
        c: "Tiny تعني صغير جداً يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، بعد يوم طويل من العمل والدراسة، أي كلمة متقدمة تعني 'متعبة جداً'؟",
      explanations: {
        a: "ممتاز يا [Fname]! Exhausted من الكلمات القوية والمستخدمة كثيراً في الحياة اليومية.",
        b: "Happy تعني سعيدة يا [Fname].",
        c: "Tiny تعني صغير جداً يا [Fname]."
      }
    }
  }
},

{
  id: 15,
  options: [
    "Could you repeat that, please?",
    "Repeat!",
    "Again say"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، في اجتماع Online لم تسمع الجملة جيداً، كيف تطلب الإعادة بطريقة مهذبة واحترافية؟",
      explanations: {
        a: "أحسنت يا [Fname]! هذه جملة احترافية ومهمة جداً في التواصل الحقيقي.",
        b: "مفهومة يا [Fname] لكنها تبدو حادة وغير مهذبة.",
        c: "الترتيب غير صحيح في الإنجليزية يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، في اجتماع Online لم تسمعي الجملة جيداً، كيف تطلبين الإعادة بطريقة مهذبة واحترافية؟",
      explanations: {
        a: "أحسنتِ يا [Fname]! هذه جملة احترافية ومهمة جداً في التواصل الحقيقي.",
        b: "مفهومة يا [Fname] لكنها تبدو حادة وغير مهذبة.",
        c: "الترتيب غير صحيح في الإنجليزية يا [Fname]."
      }
    }
  }
},

{
  id: 16,
  options: [
    "Advice",
    "Advise",
    "Advisor"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أي كلمة تعني 'نصيحة' كاسم Noun في الإنجليزية؟",
      explanations: {
        a: "رائع يا [Fname]! Advice هي الاسم الصحيح وتعني نصيحة.",
        b: "Advise فعل يا [Fname] ويعني ينصح.",
        c: "Advisor تعني مستشار يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أي كلمة تعني 'نصيحة' كاسم Noun في الإنجليزية؟",
      explanations: {
        a: "رائع يا [Fname]! Advice هي الاسم الصحيح وتعني نصيحة.",
        b: "Advise فعل يا [Fname] ويعني ينصح.",
        c: "Advisor تعني مستشار يا [Fname]."
      }
    }
  }
},
{
  id: 17,
  options: [
    "I missed the bus",
    "I lost the bus",
    "I forgot the bus"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، وصلت متأخراً إلى محطة الحافلة، كيف تقول بالإنجليزية أنك لم تلحق بالحافلة؟",
      explanations: {
        a: "ممتاز يا [Fname]! Missed the bus من أكثر التعبيرات استخداماً في الحياة اليومية.",
        b: "Lost the bus غير مستخدمة بهذا المعنى يا [Fname].",
        c: "Forgot the bus تعني نسيت الحافلة وليس فاتتك يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، وصلتِ متأخرة إلى محطة الحافلة، كيف تقولين بالإنجليزية أنكِ لم تلحقي بالحافلة؟",
      explanations: {
        a: "ممتاز يا [Fname]! Missed the bus من أكثر التعبيرات استخداماً في الحياة اليومية.",
        b: "Lost the bus غير مستخدمة بهذا المعنى يا [Fname].",
        c: "Forgot the bus تعني نسيتِ الحافلة وليس فاتتكِ يا [Fname]."
      }
    }
  }
},

{
  id: 18,
  options: [
    "What's up?",
    "What are you up?",
    "How up are you?"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، صديق أجنبي راسلك، أي عبارة Casual تستعمل كثيراً بمعنى 'كيف الحال؟'",
      explanations: {
        a: "رائع يا [Fname]! What's up? من أشهر العبارات اليومية بين الشباب.",
        b: "الترتيب غير صحيح يا [Fname].",
        c: "هذه الجملة غير طبيعية في الإنجليزية يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، صديقة أجنبية راسلتكِ، أي عبارة Casual تستعمل كثيراً بمعنى 'كيف الحال؟'",
      explanations: {
        a: "رائع يا [Fname]! What's up? من أشهر العبارات اليومية بين الشباب.",
        b: "الترتيب غير صحيح يا [Fname].",
        c: "هذه الجملة غير طبيعية في الإنجليزية يا [Fname]."
      }
    }
  }
},

{
  id: 19,
  options: [
    "I am boring",
    "I am bored",
    "I boring"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أثناء انتظار طويل في المطار، كيف تقول إنك تشعر بالملل؟",
      explanations: {
        a: "انتبه يا [Fname]! Boring تعني أنك شخص ممل، وليس أنك تشعر بالملل.",
        b: "أحسنت يا [Fname]! Bored تعبر عن شعورك أنت بالملل.",
        c: "الجملة ناقصة قواعدياً يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أثناء انتظار طويل في المطار، كيف تقولين إنكِ تشعرين بالملل؟",
      explanations: {
        a: "انتبهي يا [Fname]! Boring تعني أنكِ شخص ممل، وليس أنكِ تشعرين بالملل.",
        b: "أحسنتِ يا [Fname]! Bored تعبر عن شعوركِ أنتِ بالملل.",
        c: "الجملة ناقصة قواعدياً يا [Fname]."
      }
    }
  }
},

{
  id: 20,
  options: [
    "Turn on the lights",
    "Open the lights",
    "Start the lights"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، دخلت غرفة مظلمة وتريد أن تطلب تشغيل الأضواء، أي جملة طبيعية بالإنجليزية؟",
      explanations: {
        a: "ممتاز يا [Fname]! Turn on تستعمل كثيراً مع الأجهزة والأضواء.",
        b: "Open لا تستخدم عادة مع lights يا [Fname].",
        c: "Start ليست التعبير الطبيعي هنا يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، دخلتِ غرفة مظلمة وتريدين طلب تشغيل الأضواء، أي جملة طبيعية بالإنجليزية؟",
      explanations: {
        a: "ممتاز يا [Fname]! Turn on تستعمل كثيراً مع الأجهزة والأضواء.",
        b: "Open لا تستخدم عادة مع lights يا [Fname].",
        c: "Start ليست التعبير الطبيعي هنا يا [Fname]."
      }
    }
  }
},

{
  id: 21,
  options: [
    "Actually",
    "Currently",
    "Eventually"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، تريد أن تقول: 'حالياً أتعلم الإنجليزية'. أي كلمة تعني 'حالياً' فعلاً؟",
      explanations: {
        a: "Actually تعني في الحقيقة يا [Fname] وليست حالياً.",
        b: "رائع يا [Fname]! Currently كلمة مهمة جداً في الدراسة والعمل.",
        c: "Eventually تعني في النهاية يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، تريدين أن تقولي: 'حالياً أتعلم الإنجليزية'. أي كلمة تعني 'حالياً' فعلاً؟",
      explanations: {
        a: "Actually تعني في الحقيقة يا [Fname] وليست حالياً.",
        b: "رائع يا [Fname]! Currently كلمة مهمة جداً في الدراسة والعمل.",
        c: "Eventually تعني في النهاية يا [Fname]."
      }
    }
  }
},

{
  id: 22,
  options: [
    "How much apples do you want?",
    "How many apples do you want?",
    "How many water do you want?"
  ],
  correct_index: 1,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أنت في متجر وتريد السؤال عن عدد التفاحات، أي جملة صحيحة؟",
      explanations: {
        a: "Apples شيء يُعدّ يا [Fname] لذلك نستخدم many وليس much.",
        b: "أحسنت يا [Fname]! استخدمت How many بشكل صحيح مع الأشياء المعدودة.",
        c: "Water غير معدود يا [Fname] لذلك لا نستعمل many معه."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أنتِ في متجر وتريدين السؤال عن عدد التفاحات، أي جملة صحيحة؟",
      explanations: {
        a: "Apples شيء يُعدّ يا [Fname] لذلك نستخدم many وليس much.",
        b: "أحسنتِ يا [Fname]! استخدمتِ How many بشكل صحيح مع الأشياء المعدودة.",
        c: "Water غير معدود يا [Fname] لذلك لا نستعمل many معه."
      }
    }
  }
},

{
  id: 23,
  options: [
    "I can't afford it",
    "I don't win it",
    "I not buy it"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، رأيت هاتفاً غالياً جداً وتريد أن تقول إنك لا تستطيع دفع ثمنه، ماذا تقول؟",
      explanations: {
        a: "ممتاز يا [Fname]! Can't afford it من أهم العبارات في الحياة اليومية.",
        b: "هذه ليست الطريقة الصحيحة للتعبير يا [Fname].",
        c: "الجملة غير صحيحة قواعدياً يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، رأيتِ هاتفاً غالياً جداً وتريدين أن تقولي إنكِ لا تستطيعين دفع ثمنه، ماذا تقولين؟",
      explanations: {
        a: "ممتاز يا [Fname]! Can't afford it من أهم العبارات في الحياة اليومية.",
        b: "هذه ليست الطريقة الصحيحة للتعبير يا [Fname].",
        c: "الجملة غير صحيحة قواعدياً يا [Fname]."
      }
    }
  }
},

{
  id: 24,
  options: [
    "I'm just kidding",
    "I'm seriousing",
    "I'm laughing you"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، كنت تمزح مع صديق أجنبي وتريد أن توضح أنك لا تتكلم بجدية، ماذا تقول؟",
      explanations: {
        a: "رائع يا [Fname]! I'm just kidding من أشهر الجمل المستخدمة في المحادثات.",
        b: "هذه ليست جملة صحيحة يا [Fname].",
        c: "التعبير غير طبيعي في الإنجليزية يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، كنتِ تمزحين مع صديقة أجنبية وتريدين أن توضحي أنكِ لا تتكلمين بجدية، ماذا تقولين؟",
      explanations: {
        a: "رائع يا [Fname]! I'm just kidding من أشهر الجمل المستخدمة في المحادثات.",
        b: "هذه ليست جملة صحيحة يا [Fname].",
        c: "التعبير غير طبيعي في الإنجليزية يا [Fname]."
      }
    }
  }
},
{
  id: 25,
  options: [
    "I'm looking forward to the trip",
    "I'm waiting the trip",
    "I'm exciting for the trip"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أنت متحمس للسفر الأسبوع القادم، كيف تعبر بطريقة طبيعية واحترافية بالإنجليزية؟",
      explanations: {
        a: "ممتاز يا [Fname]! Looking forward to من أهم التعبيرات اليومية في الإنجليزية.",
        b: "في الإنجليزية نقول wait for وليس wait فقط يا [Fname].",
        c: "الصحيح هو excited وليس exciting هنا يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أنتِ متحمسة للسفر الأسبوع القادم، كيف تعبرين بطريقة طبيعية واحترافية بالإنجليزية؟",
      explanations: {
        a: "ممتاز يا [Fname]! Looking forward to من أهم التعبيرات اليومية في الإنجليزية.",
        b: "في الإنجليزية نقول wait for وليس wait فقط يا [Fname].",
        c: "الصحيح هو excited وليس exciting هنا يا [Fname]."
      }
    }
  }
},

{
  id: 26,
  options: [
    "I have no idea",
    "I don't have brain",
    "I not know nothing"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، سُئلت عن شيء لا تعرفه، ما هي العبارة الطبيعية التي تعني 'ليس لدي أي فكرة'؟",
      explanations: {
        a: "رائع يا [Fname]! هذه عبارة شائعة جداً في المحادثات اليومية.",
        b: "هذه الجملة غير طبيعية في الإنجليزية يا [Fname].",
        c: "الجملة تحتوي أخطاء كثيرة يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، سُئلتِ عن شيء لا تعرفينه، ما هي العبارة الطبيعية التي تعني 'ليس لدي أي فكرة'؟",
      explanations: {
        a: "رائع يا [Fname]! هذه عبارة شائعة جداً في المحادثات اليومية.",
        b: "هذه الجملة غير طبيعية في الإنجليزية يا [Fname].",
        c: "الجملة تحتوي أخطاء كثيرة يا [Fname]."
      }
    }
  }
},

{
  id: 27,
  options: [
    "Could",
    "Must",
    "Should"
  ],
  correct_index: 2,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، صديقك متعب جداً وتريد أن تنصحه بالنوم مبكراً، أي Modal Verb هو الأنسب؟",
      explanations: {
        a: "Could تستعمل أكثر للإمكانية أو الطلب المهذب يا [Fname].",
        b: "Must قوية جداً وكأنها أمر يا [Fname].",
        c: "أحسنت يا [Fname]! Should تستعمل كثيراً لإعطاء النصائح."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، صديقتك متعبة جداً وتريدين أن تنصحيها بالنوم مبكراً، أي Modal Verb هو الأنسب؟",
      explanations: {
        a: "Could تستعمل أكثر للإمكانية أو الطلب المهذب يا [Fname].",
        b: "Must قوية جداً وكأنها أمر يا [Fname].",
        c: "أحسنتِ يا [Fname]! Should تستعمل كثيراً لإعطاء النصائح."
      }
    }
  }
},

{
  id: 28,
  options: [
    "I'm starving",
    "I'm freezing",
    "I'm sleepy"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، لم تأكل منذ ساعات طويلة وتريد التعبير أنك جائع جداً، أي كلمة متقدمة تستخدم؟",
      explanations: {
        a: "ممتاز يا [Fname]! Starving تعني جائع جداً وتستخدم كثيراً بشكل يومي.",
        b: "Freezing تعني أشعر ببرودة شديدة يا [Fname].",
        c: "Sleepy تعني نعسان يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، لم تأكلي منذ ساعات طويلة وتريدين التعبير أنكِ جائعة جداً، أي كلمة متقدمة تستخدمين؟",
      explanations: {
        a: "ممتاز يا [Fname]! Starving تعني جائعة جداً وتستخدم كثيراً بشكل يومي.",
        b: "Freezing تعني أشعر ببرودة شديدة يا [Fname].",
        c: "Sleepy تعني نعسانة يا [Fname]."
      }
    }
  }
},

{
  id: 29,
  options: [
    "On time",
    "In time",
    "At time"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، وصلت إلى الاجتماع في الساعة المحددة تماماً، أي تعبير صحيح؟",
      explanations: {
        a: "رائع يا [Fname]! On time يعني في الوقت المحدد تماماً.",
        b: "In time تعني قبل فوات الأوان يا [Fname].",
        c: "At time ليست التعبير الصحيح هنا يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، وصلتِ إلى الاجتماع في الساعة المحددة تماماً، أي تعبير صحيح؟",
      explanations: {
        a: "رائع يا [Fname]! On time يعني في الوقت المحدد تماماً.",
        b: "In time تعني قبل فوات الأوان يا [Fname].",
        c: "At time ليست التعبير الصحيح هنا يا [Fname]."
      }
    }
  }
},

{
  id: 30,
  options: [
    "Borrow",
    "Lend",
    "Steal"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، تريد أن تطلب من صديقك أن يعطيك كتابه مؤقتاً، أي فعل يعبر عن 'أستعير'؟",
      explanations: {
        a: "أحسنت يا [Fname]! Borrow يعني يستعير، وهو فعل مهم جداً.",
        b: "Lend يعني يُعير شخصاً آخر يا [Fname].",
        c: "Steal تعني يسرق يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، تريدين أن تطلبي من صديقتك أن تعطيكِ كتابها مؤقتاً، أي فعل يعبر عن 'أستعير'؟",
      explanations: {
        a: "أحسنتِ يا [Fname]! Borrow يعني يستعير، وهو فعل مهم جداً.",
        b: "Lend يعني يُعير شخصاً آخر يا [Fname].",
        c: "Steal تعني يسرق يا [Fname]."
      }
    }
  }
},

{
  id: 31,
  options: [
    "By the way",
    "In the road",
    "On the side"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، أثناء الحديث تريد إضافة معلومة جديدة بشكل طبيعي، أي expression تستعمل؟",
      explanations: {
        a: "ممتاز يا [Fname]! By the way من أكثر العبارات استخداماً في المحادثات.",
        b: "هذه ليست العبارة المناسبة لهذا المعنى يا [Fname].",
        c: "التعبير غير صحيح لهذا السياق يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، أثناء الحديث تريدين إضافة معلومة جديدة بشكل طبيعي، أي expression تستعملين؟",
      explanations: {
        a: "ممتاز يا [Fname]! By the way من أكثر العبارات استخداماً في المحادثات.",
        b: "هذه ليست العبارة المناسبة لهذا المعنى يا [Fname].",
        c: "التعبير غير صحيح لهذا السياق يا [Fname]."
      }
    }
  }
},

{
  id: 32,
  options: [
    "I'm used to waking up early",
    "I'm used to wake up early",
    "I use to waking up early"
  ],
  correct_index: 0,

  localized_content: {
    male: {
      challenge: "يا سيد [Fname]، تريد أن تقول إنك معتاد على الاستيقاظ مبكراً، أي جملة صحيحة؟",
      explanations: {
        a: "رائع يا [Fname]! بعد used to هنا نستخدم Verb + ing.",
        b: "خطأ شائع يا [Fname]، الصيغة الصحيحة تحتاج ing.",
        c: "الجملة غير صحيحة قواعدياً يا [Fname]."
      }
    },
    female: {
      challenge: "يا عزيزتي [Fname]، تريدين أن تقولي إنكِ معتادة على الاستيقاظ مبكراً، أي جملة صحيحة؟",
      explanations: {
        a: "رائع يا [Fname]! بعد used to هنا نستخدم Verb + ing.",
        b: "خطأ شائع يا [Fname]، الصيغة الصحيحة تحتاج ing.",
        c: "الجملة غير صحيحة قواعدياً يا [Fname]."
      }
    }
  }
}
]
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

const insertLimiter = rateLimit({
  windowMs: 4 * 60 * 1000, // 5 دقائق
  max: 10, // أقصى حد 3 طلبات فقط من نفس الجهاز
  message: { error: "لقد تجاوزت الحد المسموح من المحاولات، يرجى الانتظار 4 دقائق." },
  standardHeaders: true, 
  legacyHeaders: false, 
});
// learn-three-steel.vercel.app
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
app.get('/get-static-challenges',insertLimiter, async(req, res) => {
  let startId = parseInt(req.query.startId) || 1;
    let langue = req.query.langue;
    let userId = req.query.userId;

  const limit = 12; // 💡 تم التعديل لجلب 14 موقفاً في كل دفعة


if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    userId = userId.trim().replace(/^["']|["']$/g, '');

  console.log(`[Static System] 📲 الهاتف يطلب ابتداءً من ID: ${startId}`);
const { data: userProfile, error: supabaseError } = await supabase
      .from('users_app') // اسم الجدول الخاص بالمستخدمين في قاعدة بياناتك
      .select('is_payed')
      .eq('id_users', userId) // الفلترة حسب الـ ID الفريد للمستخدم
      .single(); // جلب سطر واحد فقط
  // 1. فلترة وتجهيز الدفعة المطلوبة (14 عنصراً)

  if (supabaseError || !userProfile) {
    console.log("⚠️ Supabase Exact Error:", supabaseError);
    console.log("📌 الـ ID القادم من التطبيق هو:", `[${userId}]`);
      return res.status(404).json({ error: "User profile not found" });
    }

  if(langue == 'english'){
  let paginatedData = english.filter(challenge => challenge.id >= startId && challenge.id < startId + limit);

 

  // 2. حساب الـ nextId القادم (يقفز بمقدار طول البيانات الفعلي المجلوبة)
  let calculatedNextId = startId + paginatedData.length;

  // 🛡️ شرط الحماية الصارم (إذا طلب الهاتف ID خارج النطاق أو تسبب في مصفوفة فارغة)
  if (paginatedData.length === 0 && english.length > 0 && langue == 'english') {
    console.log(`⚠️ [Fallback] المعرّف ${startId} فارغ! تم إعادة التدوير وإرسال الدفعة الأولى.`);
    startId = 1;
    paginatedData = english.slice(0, limit);
    calculatedNextId = startId + paginatedData.length;
  }

  // 🧠 حساب هل توجد أسئلة كافية لضغطة أخرى قادمة？
  const hasMore = startId <= english.length;
      var limitMoreButton=1;

  if(userProfile.is_payed){
    var limitMoreButton='false';

  }else{
    var limitMoreButton=0;
  }

const SponsoredCard={
  active:false,
  imageUrl:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgqHMywMRdOsfBxKcJ_RwEC0vk6PgI0fEnuA&s",
  title:"تعلم ثلاث ستيل - قناة تعليمية ترفيهية",
  buttonText:"اشترك الآن",
  urlDirection:"https://www.youtube.com/@learn-three-steel",
  height:100,
  width:'100%',
  index:3
}

const languages=[
  'english',
]
// console.log('bbbbbbbbbbbbbb')
  return res.json({
    ar: {
      supported: true,
      nextId: calculatedNextId,
      hasMore: hasMore,
      data: paginatedData,
      limitMoreButton: limitMoreButton,
      SponsoredCard: SponsoredCard,
      SupportedLanguage:languages
    }
  });


  
}else if(langue == 'arabic'){
  return res.json({
    ar: {
      supported: false,
    } 
});
}
});




















app.post('/api/users/entry',insertLimiter, async (req, res) => {
  

  const { name, email, gender, id_users, user_ip } = req.body;

  // فحص أولي للبيانات في السيرفر لزيادة الأمان
  if (!name || !email || !gender || !id_users) {
    return res.status(400).json({ error: "جميع الخانات مطلوبة" });
  }

  try {
    // تنفيذ عملية الـ Insert في جدول 'test'
    const { data, error } = await supabase
      .from('users_app')
      .insert([{ name, email, gender, id_users, user_ip }])
      .select();

    if (error) {
      console.error("Supabase Error:", error.message);
      return res.status(500).json({ error: "حدث خطأ أثناء حفظ البيانات بقاعدة البيانات" });
    }

    if (data && data.length > 0) {
      // إرجاع القيم المطلوبة للتطبيق بنجاح
      return res.status(201).json({
        success: true,
        id: data[0].id,
        id_users: data[0].id_users
      });
    }

    return res.status(400).json({ error: "لم يتم إرجاع أي بيانات" });

  } catch (err) {
    console.error("Server Catch Error:", err);
    return res.status(500).json({ error: "خطأ داخلي في السيرفر" });
  }
});







const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 سيرفر المواقف الثابتة شغال بأقصى سرعة على البورت ${PORT}`));


