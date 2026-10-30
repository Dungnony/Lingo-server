import { PrismaClient } from '../../src/generated/prisma/client';

/**
 * Điểm ngữ pháp tiếng Anh theo 6 cấp — nội dung do Lingo soạn tay (wordlist
 * từ vựng không có ngữ pháp). Mỗi cấp 6 điểm, xếp từ cơ bản đến nâng cao.
 */
interface GP {
  slug: string;
  level: number;
  titleEn: string;
  titleVi: string;
  summaryVi: string;
  explanationVi: string;
  patterns: string[];
  examples: { en: string; vi: string }[];
}

export const GRAMMAR: GP[] = [
  // ---------- Level 1 · Beginner ----------
  {
    slug: 'to-be-present',
    level: 1,
    titleEn: 'The verb "to be" (am / is / are)',
    titleVi: 'Động từ "to be" ở hiện tại',
    summaryVi: 'Dùng am/is/are để nói ai/cái gì là gì, ở đâu, như thế nào.',
    explanationVi:
      'I → am; he/she/it (số ít) → is; you/we/they (số nhiều) → are.\nPhủ định: thêm not (I am not, she isn\'t, they aren\'t).\nCâu hỏi: đảo to be lên trước chủ ngữ (Are you a student?).\nSau to be thường là danh từ, tính từ hoặc cụm chỉ nơi chốn.',
    patterns: ['S + am/is/are + N/Adj', 'S + am/is/are + not + …', 'Am/Is/Are + S + …?'],
    examples: [
      { en: 'I am a student.', vi: 'Tôi là học sinh.' },
      { en: 'They are not at home now.', vi: 'Bây giờ họ không ở nhà.' },
    ],
  },
  {
    slug: 'present-simple',
    level: 1,
    titleEn: 'Present simple',
    titleVi: 'Thì hiện tại đơn',
    summaryVi: 'Diễn tả thói quen, sự thật hiển nhiên, lịch trình cố định.',
    explanationVi:
      'Chủ ngữ he/she/it: động từ thêm -s/-es (works, watches, goes).\nPhủ định: do not / does not + động từ nguyên mẫu (She doesn\'t like coffee).\nCâu hỏi: Do/Does + S + V? (Does he play football?).\nHay đi với: always, usually, often, sometimes, never, every day.',
    patterns: ['S + V(s/es) + O', 'S + do/does + not + V', 'Do/Does + S + V?'],
    examples: [
      { en: 'She works in a hospital.', vi: 'Cô ấy làm việc ở bệnh viện.' },
      { en: 'Do you drink coffee every morning?', vi: 'Bạn có uống cà phê mỗi sáng không?' },
    ],
  },
  {
    slug: 'articles-a-an-the',
    level: 1,
    titleEn: 'Articles: a, an, the',
    titleVi: 'Mạo từ a / an / the',
    summaryVi: 'a/an cho danh từ số ít chưa xác định; the cho thứ đã xác định.',
    explanationVi:
      'a đứng trước âm phụ âm (a book, a university), an đứng trước âm nguyên âm (an apple, an hour) — xét theo ÂM, không theo chữ cái.\nthe dùng khi người nghe biết đang nói về cái nào (the book on the table), vật duy nhất (the sun).\nKhông dùng mạo từ với danh từ số nhiều/không đếm được nói chung chung (I like music).',
    patterns: ['a + phụ âm', 'an + nguyên âm', 'the + danh từ đã xác định'],
    examples: [
      { en: 'I saw a dog in the park.', vi: 'Tôi thấy một con chó trong công viên.' },
      { en: 'The dog was very friendly.', vi: 'Con chó đó rất thân thiện.' },
    ],
  },
  {
    slug: 'plural-nouns',
    level: 1,
    titleEn: 'Plural nouns',
    titleVi: 'Danh từ số nhiều',
    summaryVi: 'Hầu hết danh từ thêm -s; một số có dạng bất quy tắc.',
    explanationVi:
      'Thường thêm -s: book → books.\nTận cùng -s, -sh, -ch, -x, -o: thêm -es (boxes, watches, potatoes).\nPhụ âm + y → -ies (city → cities); -f/-fe → -ves (knife → knives).\nBất quy tắc: man → men, child → children, foot → feet, person → people.',
    patterns: ['N + s', 'N(s/sh/ch/x) + es', 'phụ âm + y → ies'],
    examples: [
      { en: 'There are three children in the room.', vi: 'Có ba đứa trẻ trong phòng.' },
      { en: 'These boxes are very heavy.', vi: 'Những cái hộp này rất nặng.' },
    ],
  },
  {
    slug: 'possessive-adjectives',
    level: 1,
    titleEn: 'Possessive adjectives',
    titleVi: 'Tính từ sở hữu (my, your, his…)',
    summaryVi: 'Đứng trước danh từ để chỉ vật đó thuộc về ai.',
    explanationVi:
      'I → my, you → your, he → his, she → her, it → its, we → our, they → their.\nLuôn đứng trước danh từ: my phone, their house.\nPhân biệt its (của nó) với it\'s (= it is).\nSở hữu của danh từ: thêm \'s (Tom\'s car, my parents\' house).',
    patterns: ['my/your/his/her/its/our/their + N', "N + 's + N"],
    examples: [
      { en: 'This is my brother and his wife.', vi: 'Đây là anh trai tôi và vợ anh ấy.' },
      { en: "Is that Anna's bag?", vi: 'Kia có phải túi của Anna không?' },
    ],
  },
  {
    slug: 'there-is-there-are',
    level: 1,
    titleEn: 'There is / There are',
    titleVi: 'Cấu trúc "Có…" (There is / There are)',
    summaryVi: 'Dùng để nói về sự tồn tại của người/vật ở đâu đó.',
    explanationVi:
      'There is + danh từ số ít / không đếm được; There are + danh từ số nhiều.\nPhủ định: There isn\'t any / There aren\'t any.\nCâu hỏi: Is there…? / Are there…? — trả lời Yes, there is / No, there aren\'t.',
    patterns: ['There is + N số ít', 'There are + N số nhiều', 'Is/Are there + …?'],
    examples: [
      { en: 'There is a bank near my house.', vi: 'Có một ngân hàng gần nhà tôi.' },
      { en: 'Are there any eggs in the fridge?', vi: 'Trong tủ lạnh có quả trứng nào không?' },
    ],
  },

  {
    slug: 'object-pronouns',
    level: 1,
    titleEn: 'Subject and object pronouns',
    titleVi: 'Đại từ chủ ngữ và tân ngữ',
    summaryVi: 'I/he/she… làm chủ ngữ; me/him/her… đứng sau động từ hoặc giới từ.',
    explanationVi:
      'Chủ ngữ: I, you, he, she, it, we, they.\nTân ngữ: me, you, him, her, it, us, them.\nTân ngữ đứng sau động từ (She loves him) hoặc sau giới từ (Come with me).\nKhông nói "Me and him went" trong văn chuẩn — dùng "He and I went".',
    patterns: ['S (I/he/she…) + V', 'V + O (me/him/her…)', 'giới từ + O'],
    examples: [
      { en: 'I called her yesterday.', vi: 'Hôm qua tôi đã gọi cho cô ấy.' },
      { en: 'Can you help us, please?', vi: 'Bạn giúp chúng tôi được không?' },
    ],
  },
  {
    slug: 'imperatives',
    level: 1,
    titleEn: 'Imperatives',
    titleVi: 'Câu mệnh lệnh',
    summaryVi: 'Dùng động từ nguyên mẫu đầu câu để ra lệnh, hướng dẫn, mời mọc.',
    explanationVi:
      'Khẳng định: động từ nguyên mẫu, không có chủ ngữ (Open the door).\nPhủ định: Don\'t + V (Don\'t run).\nLịch sự hơn: thêm please (Please sit down).\nRủ cùng làm: Let\'s + V (Let\'s go!).',
    patterns: ['V + O', "Don't + V", "Let's + V"],
    examples: [
      { en: 'Close the window, please.', vi: 'Làm ơn đóng cửa sổ lại.' },
      { en: "Don't be late!", vi: 'Đừng đến muộn nhé!' },
    ],
  },
  {
    slug: 'demonstratives',
    level: 1,
    titleEn: 'This, that, these, those',
    titleVi: 'Từ chỉ định this / that / these / those',
    summaryVi: 'Chỉ người/vật ở gần (this, these) hoặc ở xa (that, those).',
    explanationVi:
      'this + danh từ số ít ở gần; these + danh từ số nhiều ở gần.\nthat + danh từ số ít ở xa; those + danh từ số nhiều ở xa.\nCó thể đứng một mình làm đại từ: This is my sister.',
    patterns: ['this/that + N số ít', 'these/those + N số nhiều'],
    examples: [
      { en: 'This bag is mine, and that one is yours.', vi: 'Cái túi này của tôi, còn cái kia của bạn.' },
      { en: 'Those shoes are very expensive.', vi: 'Đôi giày kia rất đắt.' },
    ],
  },
  {
    slug: 'prepositions-of-place',
    level: 1,
    titleEn: 'Prepositions of place',
    titleVi: 'Giới từ chỉ nơi chốn',
    summaryVi: 'in, on, under, next to, behind, between… để nói vật ở đâu.',
    explanationVi:
      'in: bên trong (in the box); on: trên bề mặt (on the table); under: bên dưới.\nnext to: bên cạnh; behind: phía sau; in front of: phía trước; between A and B: ở giữa.\nat dùng cho một điểm cụ thể (at the door, at home, at school).',
    patterns: ['S + be + giới từ + N'],
    examples: [
      { en: 'The keys are on the table.', vi: 'Chìa khoá ở trên bàn.' },
      { en: 'The cat is under the bed.', vi: 'Con mèo ở dưới gầm giường.' },
    ],
  },
  {
    slug: 'prepositions-of-time',
    level: 1,
    titleEn: 'Prepositions of time: at, on, in',
    titleVi: 'Giới từ chỉ thời gian at / on / in',
    summaryVi: 'at giờ, on ngày, in tháng/năm/mùa/buổi.',
    explanationVi:
      'at + giờ và thời điểm cụ thể: at 7 o\'clock, at night, at the weekend.\non + ngày, thứ, ngày lễ cụ thể: on Monday, on 2 September, on my birthday.\nin + tháng, năm, mùa, buổi: in May, in 2025, in summer, in the morning.\nKhông dùng giới từ trước next, last, this, every (next week, every day).',
    patterns: ['at + giờ', 'on + ngày/thứ', 'in + tháng/năm/buổi'],
    examples: [
      { en: 'The class starts at 8 a.m. on Monday.', vi: 'Lớp học bắt đầu lúc 8 giờ sáng thứ Hai.' },
      { en: 'I was born in 2005.', vi: 'Tôi sinh năm 2005.' },
    ],
  },
  {
    slug: 'wh-questions',
    level: 1,
    titleEn: 'Wh- questions',
    titleVi: 'Câu hỏi với từ để hỏi (what, where, when…)',
    summaryVi: 'Từ để hỏi đứng đầu câu, sau đó là trợ động từ và chủ ngữ.',
    explanationVi:
      'what: cái gì; where: ở đâu; when: khi nào; who: ai; why: tại sao; how: thế nào; how much/many: bao nhiêu.\nCấu trúc: Wh- + am/is/are hoặc do/does/did + S + V?\nKhi who/what làm chủ ngữ thì không cần do/does: Who called you?',
    patterns: ['Wh- + be + S…?', 'Wh- + do/does + S + V?'],
    examples: [
      { en: 'Where do you live?', vi: 'Bạn sống ở đâu?' },
      { en: 'What time is it?', vi: 'Mấy giờ rồi?' },
    ],
  },

  // ---------- Level 2 · Elementary ----------
  {
    slug: 'present-continuous',
    level: 2,
    titleEn: 'Present continuous',
    titleVi: 'Thì hiện tại tiếp diễn',
    summaryVi: 'Diễn tả việc đang xảy ra lúc nói hoặc kế hoạch sắp tới đã sắp xếp.',
    explanationVi:
      'Cấu trúc: am/is/are + V-ing.\nDùng cho hành động đang diễn ra (now, at the moment) và kế hoạch đã định (I\'m meeting Tom tomorrow).\nKhông dùng với động từ chỉ trạng thái như know, like, want, believe (nói I know, không nói I am knowing).',
    patterns: ['S + am/is/are + V-ing', 'S + am/is/are + not + V-ing'],
    examples: [
      { en: 'She is cooking dinner right now.', vi: 'Cô ấy đang nấu bữa tối.' },
      { en: "We're flying to Da Nang next week.", vi: 'Tuần sau chúng tôi bay ra Đà Nẵng.' },
    ],
  },
  {
    slug: 'past-simple',
    level: 2,
    titleEn: 'Past simple',
    titleVi: 'Thì quá khứ đơn',
    summaryVi: 'Diễn tả hành động đã xảy ra và kết thúc tại thời điểm xác định trong quá khứ.',
    explanationVi:
      'Động từ có quy tắc thêm -ed (worked, played); bất quy tắc phải học thuộc (go → went, see → saw, buy → bought).\nPhủ định và câu hỏi dùng did + động từ nguyên mẫu: I didn\'t go. Did you see it?\nHay đi với: yesterday, last week, ago, in 2020.',
    patterns: ['S + V-ed / V2', 'S + did not + V', 'Did + S + V?'],
    examples: [
      { en: 'I visited my grandparents last weekend.', vi: 'Cuối tuần trước tôi đã về thăm ông bà.' },
      { en: "He didn't come to the party.", vi: 'Anh ấy đã không đến bữa tiệc.' },
    ],
  },
  {
    slug: 'comparatives-superlatives',
    level: 2,
    titleEn: 'Comparatives and superlatives',
    titleVi: 'So sánh hơn và so sánh nhất',
    summaryVi: 'So sánh 2 đối tượng (hơn) hoặc 1 đối tượng với cả nhóm (nhất).',
    explanationVi:
      'Tính từ ngắn: thêm -er / the -est (tall → taller → the tallest).\nTính từ dài: more / the most (expensive → more expensive → the most expensive).\nBất quy tắc: good → better → the best; bad → worse → the worst; far → farther/further.\nSo sánh hơn đi với than: She is taller than me.',
    patterns: ['Adj-er + than', 'more + Adj + than', 'the + Adj-est / the most + Adj'],
    examples: [
      { en: 'This phone is cheaper than that one.', vi: 'Điện thoại này rẻ hơn cái kia.' },
      { en: "It's the most beautiful beach I've ever seen.", vi: 'Đó là bãi biển đẹp nhất tôi từng thấy.' },
    ],
  },
  {
    slug: 'countable-uncountable',
    level: 2,
    titleEn: 'Countable and uncountable nouns',
    titleVi: 'Danh từ đếm được và không đếm được',
    summaryVi: 'Chọn đúng some/any, much/many, a few/a little theo loại danh từ.',
    explanationVi:
      'Đếm được: có số nhiều (apples, chairs). Không đếm được: không có số nhiều (water, money, information, advice).\nmany / a few + đếm được; much / a little + không đếm được; a lot of dùng cho cả hai.\nsome dùng trong câu khẳng định và lời mời; any dùng trong câu phủ định và câu hỏi.',
    patterns: ['many / a few + N đếm được', 'much / a little + N không đếm được', 'some / any + N'],
    examples: [
      { en: "How much money do you have?", vi: 'Bạn có bao nhiêu tiền?' },
      { en: "There aren't many people here today.", vi: 'Hôm nay ở đây không có nhiều người.' },
    ],
  },
  {
    slug: 'going-to-future',
    level: 2,
    titleEn: 'Future with "be going to"',
    titleVi: 'Tương lai với "be going to"',
    summaryVi: 'Nói về dự định đã có từ trước hoặc dự đoán dựa trên dấu hiệu hiện tại.',
    explanationVi:
      'Cấu trúc: am/is/are going to + V.\nDự định: I\'m going to learn Japanese next year.\nDự đoán có căn cứ: Look at those clouds — it\'s going to rain.\nKhi nói nhanh thường đọc thành "gonna" nhưng không viết như vậy trong văn bản trang trọng.',
    patterns: ['S + am/is/are + going to + V'],
    examples: [
      { en: "We're going to buy a new car.", vi: 'Chúng tôi định mua một chiếc ô tô mới.' },
      { en: "Be careful! You're going to fall.", vi: 'Cẩn thận! Bạn sắp ngã đấy.' },
    ],
  },
  {
    slug: 'can-could-ability',
    level: 2,
    titleEn: 'Can / could for ability and requests',
    titleVi: 'Can / could — khả năng và lời đề nghị',
    summaryVi: 'can = có thể (hiện tại), could = đã có thể (quá khứ) hoặc lời nhờ lịch sự.',
    explanationVi:
      'can / could + động từ nguyên mẫu, không chia theo ngôi (she can swim, không nói she cans).\nPhủ định: can\'t / couldn\'t.\nNhờ vả: Can you help me? (thân mật) — Could you help me? (lịch sự hơn).',
    patterns: ['S + can/could + V', 'Can/Could + S + V?'],
    examples: [
      { en: 'I can speak a little English.', vi: 'Tôi có thể nói một chút tiếng Anh.' },
      { en: 'Could you open the window, please?', vi: 'Bạn mở giúp tôi cửa sổ được không?' },
    ],
  },

  {
    slug: 'adverbs-of-frequency',
    level: 2,
    titleEn: 'Adverbs of frequency',
    titleVi: 'Trạng từ chỉ tần suất',
    summaryVi: 'always, usually, often, sometimes, rarely, never — nói mức độ thường xuyên.',
    explanationVi:
      'Thứ tự từ thường xuyên nhất: always > usually > often > sometimes > rarely > never.\nĐứng TRƯỚC động từ thường (I often walk to school) nhưng SAU to be (She is always late).\nHỏi tần suất: How often do you…?',
    patterns: ['S + adverb + V', 'S + be + adverb'],
    examples: [
      { en: 'I usually get up at six.', vi: 'Tôi thường dậy lúc sáu giờ.' },
      { en: 'He is never on time.', vi: 'Anh ấy không bao giờ đúng giờ.' },
    ],
  },
  {
    slug: 'possessive-pronouns',
    level: 2,
    titleEn: 'Possessive pronouns',
    titleVi: 'Đại từ sở hữu (mine, yours…)',
    summaryVi: 'Thay cho "tính từ sở hữu + danh từ" để khỏi lặp lại danh từ.',
    explanationVi:
      'mine, yours, his, hers, ours, theirs (it không có dạng này).\nĐứng một mình, không có danh từ theo sau: This book is mine (= my book).\nWhose…? dùng để hỏi sở hữu: Whose phone is this?',
    patterns: ['N + be + mine/yours…', 'Whose + N + be + this?'],
    examples: [
      { en: 'Is this umbrella yours?', vi: 'Cái ô này có phải của bạn không?' },
      { en: 'Their house is bigger than ours.', vi: 'Nhà họ to hơn nhà chúng tôi.' },
    ],
  },
  {
    slug: 'would-like',
    level: 2,
    titleEn: 'Would like',
    titleVi: 'Would like — nói mong muốn lịch sự',
    summaryVi: 'Lịch sự hơn want; dùng khi gọi món, đề nghị, mời.',
    explanationVi:
      'would like + danh từ: I\'d like a coffee.\nwould like + to V: I\'d like to book a table.\nMời: Would you like some tea? — Yes, please / No, thank you.\nKhác với like (thích nói chung): I like coffee ≠ I\'d like a coffee (bây giờ muốn).',
    patterns: ["S + 'd like + N / to V", 'Would you like + N / to V?'],
    examples: [
      { en: "I'd like a glass of water, please.", vi: 'Cho tôi một cốc nước nhé.' },
      { en: 'Would you like to come with us?', vi: 'Bạn có muốn đi cùng chúng tôi không?' },
    ],
  },
  {
    slug: 'too-and-enough',
    level: 2,
    titleEn: 'Too and enough',
    titleVi: 'Too và enough',
    summaryVi: 'too = quá (mức không mong muốn); enough = đủ.',
    explanationVi:
      'too + tính từ: This coffee is too hot (to drink).\ntính từ + enough: She is old enough to drive.\nenough + danh từ: We have enough time.\nChú ý vị trí: enough đứng SAU tính từ nhưng TRƯỚC danh từ.',
    patterns: ['too + Adj (+ to V)', 'Adj + enough (+ to V)', 'enough + N'],
    examples: [
      { en: 'The box is too heavy for me.', vi: 'Cái hộp quá nặng đối với tôi.' },
      { en: "We don't have enough chairs.", vi: 'Chúng ta không có đủ ghế.' },
    ],
  },
  {
    slug: 'basic-conjunctions',
    level: 2,
    titleEn: 'And, but, or, so, because',
    titleVi: 'Liên từ cơ bản',
    summaryVi: 'Nối hai ý: thêm (and), đối lập (but), lựa chọn (or), kết quả (so), lý do (because).',
    explanationVi:
      'and: thêm thông tin; but: ý trái ngược; or: lựa chọn.\nso: kết quả — đứng trước mệnh đề kết quả (It rained, so we stayed home).\nbecause: lý do — đứng trước mệnh đề lý do (We stayed home because it rained).',
    patterns: ['Mệnh đề, so + kết quả', 'Mệnh đề + because + lý do'],
    examples: [
      { en: 'I was tired, so I went to bed early.', vi: 'Tôi mệt nên đi ngủ sớm.' },
      { en: 'She is happy because she passed the test.', vi: 'Cô ấy vui vì đã qua bài kiểm tra.' },
    ],
  },
  {
    slug: 'like-love-hate-ing',
    level: 2,
    titleEn: 'Like, love, hate + -ing',
    titleVi: 'Like / love / hate + V-ing',
    summaryVi: 'Nói sở thích chung với động từ thêm -ing.',
    explanationVi:
      'like, love, enjoy, hate, don\'t mind + V-ing: I love swimming.\nlike/love/hate + to V cũng dùng được, nghĩa gần như nhau.\nenjoy và don\'t mind CHỈ đi với V-ing (I enjoy reading, không nói enjoy to read).',
    patterns: ['S + like/love/hate + V-ing', 'S + enjoy + V-ing'],
    examples: [
      { en: 'My brother loves playing football.', vi: 'Em trai tôi rất thích chơi bóng đá.' },
      { en: "I don't mind waiting.", vi: 'Tôi không ngại chờ đâu.' },
    ],
  },

  // ---------- Level 3 · Pre-Intermediate ----------
  {
    slug: 'present-perfect',
    level: 3,
    titleEn: 'Present perfect',
    titleVi: 'Thì hiện tại hoàn thành',
    summaryVi: 'Nối quá khứ với hiện tại: trải nghiệm, kết quả còn liên quan, việc kéo dài đến nay.',
    explanationVi:
      'Cấu trúc: have/has + V3 (quá khứ phân từ).\nTrải nghiệm: Have you ever been to London?\nKết quả hiện tại: I\'ve lost my keys (giờ vẫn chưa tìm thấy).\nKéo dài đến nay với for (khoảng thời gian) / since (mốc thời gian).\nKhông dùng với thời điểm quá khứ xác định (không nói I have seen him yesterday).',
    patterns: ['S + have/has + V3', 'Have/Has + S + ever + V3?', '… for + khoảng / since + mốc'],
    examples: [
      { en: "I've lived here since 2019.", vi: 'Tôi đã sống ở đây từ năm 2019.' },
      { en: 'Have you ever tried durian?', vi: 'Bạn đã bao giờ ăn sầu riêng chưa?' },
    ],
  },
  {
    slug: 'will-vs-going-to',
    level: 3,
    titleEn: 'Will vs. be going to',
    titleVi: 'Phân biệt will và be going to',
    summaryVi: 'will cho quyết định tức thời, lời hứa, dự đoán chung; going to cho dự định có sẵn.',
    explanationVi:
      'will + V: quyết định ngay lúc nói (I\'ll answer the phone), lời hứa/đề nghị (I\'ll help you), dự đoán theo ý kiến (I think it will be fine).\nbe going to + V: kế hoạch đã quyết từ trước, hoặc dự đoán có bằng chứng trước mắt.',
    patterns: ['S + will + V', 'S + am/is/are going to + V'],
    examples: [
      { en: "The phone's ringing — I'll get it.", vi: 'Điện thoại kêu kìa — để tôi nghe.' },
      { en: "I'm going to study abroad next year.", vi: 'Năm sau tôi sẽ đi du học (đã lên kế hoạch).' },
    ],
  },
  {
    slug: 'first-conditional',
    level: 3,
    titleEn: 'First conditional',
    titleVi: 'Câu điều kiện loại 1',
    summaryVi: 'Điều kiện có thật, có khả năng xảy ra ở hiện tại hoặc tương lai.',
    explanationVi:
      'If + hiện tại đơn, will + V.\nMệnh đề If không dùng will (nói If it rains, không nói If it will rain).\nĐổi vị trí 2 mệnh đề được; khi If đứng đầu thì có dấu phẩy.\nunless = if … not (Unless you hurry, you\'ll miss the bus).',
    patterns: ['If + S + V(s/es), S + will + V', 'S + will + V + if + S + V(s/es)'],
    examples: [
      { en: "If it rains tomorrow, we'll stay at home.", vi: 'Nếu mai trời mưa, chúng ta sẽ ở nhà.' },
      { en: "You'll pass the exam if you study hard.", vi: 'Bạn sẽ đỗ nếu học chăm chỉ.' },
    ],
  },
  {
    slug: 'past-continuous',
    level: 3,
    titleEn: 'Past continuous',
    titleVi: 'Thì quá khứ tiếp diễn',
    summaryVi: 'Hành động đang diễn ra tại một thời điểm trong quá khứ, thường bị một việc khác cắt ngang.',
    explanationVi:
      'Cấu trúc: was/were + V-ing.\nKết hợp với quá khứ đơn: việc dài dùng quá khứ tiếp diễn, việc ngắn chen vào dùng quá khứ đơn (I was having dinner when he called).\nwhile thường đi với quá khứ tiếp diễn; when thường đi với quá khứ đơn.',
    patterns: ['S + was/were + V-ing', 'S + was/were + V-ing + when + S + V2'],
    examples: [
      { en: 'At 8 p.m. yesterday I was watching TV.', vi: 'Lúc 8 giờ tối qua tôi đang xem TV.' },
      { en: 'She was walking home when it started to rain.', vi: 'Cô ấy đang đi bộ về nhà thì trời đổ mưa.' },
    ],
  },
  {
    slug: 'obligation-modals',
    level: 3,
    titleEn: 'Must / have to / should',
    titleVi: 'Bắt buộc và lời khuyên: must, have to, should',
    summaryVi: 'must/have to = phải; should = nên; mustn\'t ≠ don\'t have to.',
    explanationVi:
      'must: bắt buộc do người nói thấy cần (I must call my mom).\nhave to: bắt buộc do quy định/hoàn cảnh bên ngoài (We have to wear a uniform).\nmustn\'t = cấm; don\'t have to = không cần (nhưng làm cũng được).\nshould / shouldn\'t: lời khuyên.',
    patterns: ['S + must/should + V', 'S + have/has to + V', "S + mustn't / don't have to + V"],
    examples: [
      { en: "You mustn't smoke in the hospital.", vi: 'Bạn không được hút thuốc trong bệnh viện.' },
      { en: "You don't have to come if you're busy.", vi: 'Nếu bận thì bạn không cần phải đến.' },
    ],
  },
  {
    slug: 'gerunds-infinitives',
    level: 3,
    titleEn: 'Gerunds and infinitives',
    titleVi: 'V-ing hay to V sau động từ',
    summaryVi: 'Một số động từ đi với V-ing, một số đi với to V — cần học theo từng động từ.',
    explanationVi:
      'Đi với V-ing: enjoy, finish, avoid, mind, suggest, keep (I enjoy reading).\nĐi với to V: want, decide, hope, plan, agree, need (She decided to leave).\nSau giới từ luôn dùng V-ing (good at swimming, before leaving).\nMột số đổi nghĩa: stop to do (dừng lại để làm) ≠ stop doing (thôi làm).',
    patterns: ['enjoy/finish/avoid + V-ing', 'want/decide/hope + to V', 'giới từ + V-ing'],
    examples: [
      { en: 'I enjoy listening to music.', vi: 'Tôi thích nghe nhạc.' },
      { en: 'They decided to move to Ho Chi Minh City.', vi: 'Họ quyết định chuyển vào TP. Hồ Chí Minh.' },
    ],
  },

  {
    slug: 'zero-conditional',
    level: 3,
    titleEn: 'Zero conditional',
    titleVi: 'Câu điều kiện loại 0',
    summaryVi: 'Sự thật hiển nhiên, quy luật: nếu A xảy ra thì luôn có B.',
    explanationVi:
      'If + hiện tại đơn, hiện tại đơn.\nDùng cho sự thật khoa học, thói quen, quy tắc (If you heat ice, it melts).\nCó thể thay if bằng when mà nghĩa gần như không đổi.',
    patterns: ['If + S + V(s/es), S + V(s/es)'],
    examples: [
      { en: 'If you mix red and blue, you get purple.', vi: 'Nếu trộn màu đỏ và xanh dương, bạn được màu tím.' },
      { en: "If I drink coffee at night, I can't sleep.", vi: 'Nếu uống cà phê buổi tối, tôi không ngủ được.' },
    ],
  },
  {
    slug: 'as-as-comparisons',
    level: 3,
    titleEn: 'As … as comparisons',
    titleVi: 'So sánh bằng as … as',
    summaryVi: 'Nói hai thứ ngang nhau (as … as) hoặc không bằng (not as … as).',
    explanationVi:
      'as + tính từ/trạng từ + as: She is as tall as her mother.\nnot as … as = kém hơn: This film isn\'t as good as the book.\nthe same as / the same + N + as: My phone is the same as yours.',
    patterns: ['S + be + as + Adj + as + O', 'S + be + not as + Adj + as + O'],
    examples: [
      { en: 'Hanoi is not as hot as Ho Chi Minh City.', vi: 'Hà Nội không nóng bằng TP. Hồ Chí Minh.' },
      { en: 'He runs as fast as a professional.', vi: 'Anh ấy chạy nhanh như vận động viên chuyên nghiệp.' },
    ],
  },
  {
    slug: 'present-perfect-vs-past-simple',
    level: 3,
    titleEn: 'Present perfect vs. past simple',
    titleVi: 'Phân biệt hiện tại hoàn thành và quá khứ đơn',
    summaryVi: 'Quá khứ đơn có thời điểm xác định; hiện tại hoàn thành nối với hiện tại.',
    explanationVi:
      'Quá khứ đơn: việc đã xong tại thời điểm rõ ràng (yesterday, in 2020, last week).\nHiện tại hoàn thành: không nói thời điểm, hoặc khoảng thời gian chưa kết thúc (today, this week, ever, yet, already).\nHỏi bằng hiện tại hoàn thành, kể chi tiết bằng quá khứ đơn: Have you been to Japan? — Yes, I went there in 2023.',
    patterns: ['S + V2 + thời điểm quá khứ', 'S + have/has + V3 (+ ever/yet/already)'],
    examples: [
      { en: "I've lost my phone. I lost it on the bus.", vi: 'Tôi làm mất điện thoại rồi. Tôi đánh rơi nó trên xe buýt.' },
      { en: "She hasn't finished her homework yet.", vi: 'Cô ấy vẫn chưa làm xong bài tập.' },
    ],
  },
  {
    slug: 'question-tags',
    level: 3,
    titleEn: 'Question tags',
    titleVi: 'Câu hỏi đuôi',
    summaryVi: 'Thêm câu hỏi ngắn cuối câu để xác nhận: …, isn\'t it? / …, do you?',
    explanationVi:
      'Câu khẳng định → đuôi phủ định; câu phủ định → đuôi khẳng định.\nĐuôi dùng lại trợ động từ/to be của câu chính, thì động từ thường dùng do/does/did.\nĐặc biệt: I am → aren\'t I?; Let\'s … → shall we?',
    patterns: ["S + V (khẳng định), aux + n't + S?", 'S + aux + not + V, aux + S?'],
    examples: [
      { en: "It's a beautiful day, isn't it?", vi: 'Hôm nay trời đẹp, phải không?' },
      { en: "You don't eat meat, do you?", vi: 'Bạn không ăn thịt, đúng không?' },
    ],
  },
  {
    slug: 'indefinite-pronouns',
    level: 3,
    titleEn: 'Someone, anyone, no one, everyone',
    titleVi: 'Đại từ bất định',
    summaryVi: 'some-/any-/no-/every- + one/body/thing/where.',
    explanationVi:
      'some-: câu khẳng định và lời mời (someone, something, somewhere).\nany-: câu phủ định và câu hỏi (anyone, anything, anywhere).\nno-: mang nghĩa phủ định, dùng với động từ khẳng định (Nobody knows).\nevery-: tất cả; luôn đi với động từ số ít (Everyone is here).',
    patterns: ['some-/any-/no-/every- + one/body/thing/where'],
    examples: [
      { en: 'Is there anything to eat?', vi: 'Có gì để ăn không?' },
      { en: 'Everyone loves this song.', vi: 'Ai cũng thích bài hát này.' },
    ],
  },
  {
    slug: 'so-and-such',
    level: 3,
    titleEn: 'So and such',
    titleVi: 'So và such — nhấn mạnh mức độ',
    summaryVi: 'so + tính từ; such (a) + tính từ + danh từ; thường kèm that + kết quả.',
    explanationVi:
      'so + tính từ/trạng từ: The film was so boring.\nsuch + a/an + tính từ + danh từ số ít: It was such a boring film.\nsuch + tính từ + danh từ số nhiều/không đếm được: such nice people.\nKết quả: so/such … that + mệnh đề (It was so cold that we stayed inside).',
    patterns: ['so + Adj (+ that …)', 'such (a/an) + Adj + N (+ that …)'],
    examples: [
      { en: 'She was so tired that she fell asleep at once.', vi: 'Cô ấy mệt đến mức ngủ ngay lập tức.' },
      { en: 'It was such a good idea!', vi: 'Đó đúng là một ý tưởng hay!' },
    ],
  },

  // ---------- Level 4 · Intermediate ----------
  {
    slug: 'passive-voice',
    level: 4,
    titleEn: 'The passive voice',
    titleVi: 'Câu bị động',
    summaryVi: 'Nhấn mạnh đối tượng chịu tác động thay vì người thực hiện hành động.',
    explanationVi:
      'Cấu trúc: be (chia theo thì) + V3.\nHiện tại đơn: is made; quá khứ đơn: was built; hiện tại hoàn thành: has been sold; tương lai: will be done.\nThêm by + người làm khi thông tin đó quan trọng.\nHay dùng trong tin tức, văn bản khoa học, quy trình.',
    patterns: ['S + be + V3 (+ by O)', 'S + modal + be + V3'],
    examples: [
      { en: 'This bridge was built in 1990.', vi: 'Cây cầu này được xây năm 1990.' },
      { en: 'The results will be announced tomorrow.', vi: 'Kết quả sẽ được công bố vào ngày mai.' },
    ],
  },
  {
    slug: 'second-conditional',
    level: 4,
    titleEn: 'Second conditional',
    titleVi: 'Câu điều kiện loại 2',
    summaryVi: 'Điều kiện không có thật hoặc khó xảy ra ở hiện tại/tương lai.',
    explanationVi:
      'If + quá khứ đơn, would + V.\nVới to be, dùng were cho mọi ngôi trong văn trang trọng (If I were you, …).\nDùng để tưởng tượng, đưa lời khuyên (If I were you, I would apologise).\nSo với loại 1: loại 2 thể hiện người nói thấy điều kiện khó thành sự thật.',
    patterns: ['If + S + V2/were, S + would + V'],
    examples: [
      { en: 'If I had more time, I would learn to play the guitar.', vi: 'Nếu có nhiều thời gian hơn, tôi sẽ học chơi guitar.' },
      { en: 'If I were you, I would take the job.', vi: 'Nếu là bạn, tôi sẽ nhận công việc đó.' },
    ],
  },
  {
    slug: 'relative-clauses',
    level: 4,
    titleEn: 'Relative clauses',
    titleVi: 'Mệnh đề quan hệ',
    summaryVi: 'Bổ sung thông tin cho danh từ bằng who, which, that, whose, where.',
    explanationVi:
      'who: người; which: vật; that: người hoặc vật (chỉ trong mệnh đề xác định); whose: sở hữu; where: nơi chốn.\nMệnh đề xác định (không dấu phẩy) cần thiết để biết đang nói tới ai/cái gì.\nMệnh đề không xác định (có dấu phẩy) chỉ thêm thông tin phụ và không dùng that.\nCó thể lược who/which/that khi nó làm tân ngữ (The book (that) I bought…).',
    patterns: ['N + who/which/that + V', 'N, which/who + …,', 'N + whose + N'],
    examples: [
      { en: 'The woman who lives next door is a doctor.', vi: 'Người phụ nữ sống cạnh nhà tôi là bác sĩ.' },
      { en: 'Hue, which is in central Vietnam, has many old temples.', vi: 'Huế, nằm ở miền Trung Việt Nam, có nhiều ngôi chùa cổ.' },
    ],
  },
  {
    slug: 'reported-speech',
    level: 4,
    titleEn: 'Reported speech',
    titleVi: 'Câu tường thuật',
    summaryVi: 'Thuật lại lời người khác, thường lùi thì và đổi đại từ, trạng từ.',
    explanationVi:
      'Lùi thì khi động từ tường thuật ở quá khứ: am → was, will → would, did/have done → had done.\nĐổi đại từ và trạng từ: today → that day, tomorrow → the next day, here → there.\nCâu hỏi: asked + if/whether hoặc từ để hỏi, giữ trật tự câu khẳng định (She asked where I lived).\nMệnh lệnh: told/asked + O + to V.',
    patterns: ['S + said (that) + S + V (lùi thì)', 'S + asked + if/wh- + S + V', 'S + told + O + (not) to V'],
    examples: [
      { en: 'He said that he was tired.', vi: 'Anh ấy nói rằng anh ấy mệt.' },
      { en: 'She asked me where I worked.', vi: 'Cô ấy hỏi tôi làm việc ở đâu.' },
    ],
  },
  {
    slug: 'present-perfect-continuous',
    level: 4,
    titleEn: 'Present perfect continuous',
    titleVi: 'Thì hiện tại hoàn thành tiếp diễn',
    summaryVi: 'Nhấn mạnh quá trình kéo dài từ quá khứ đến hiện tại.',
    explanationVi:
      'Cấu trúc: have/has been + V-ing.\nNhấn mạnh độ dài/sự liên tục (I\'ve been waiting for two hours).\nGiải thích dấu hiệu hiện tại (Your eyes are red — have you been crying?).\nSo với hiện tại hoàn thành: thì này nói về quá trình, hiện tại hoàn thành nói về kết quả/số lượng (I\'ve written three emails).',
    patterns: ['S + have/has been + V-ing (+ for/since)'],
    examples: [
      { en: "I've been learning English for three years.", vi: 'Tôi đã học tiếng Anh được ba năm rồi.' },
      { en: "It has been raining all morning.", vi: 'Trời mưa suốt cả buổi sáng.' },
    ],
  },
  {
    slug: 'used-to',
    level: 4,
    titleEn: 'Used to / be used to / get used to',
    titleVi: 'Phân biệt used to, be used to, get used to',
    summaryVi: 'used to V = thói quen trong quá khứ; be/get used to V-ing = đã quen / dần quen.',
    explanationVi:
      'used to + V: việc từng làm thường xuyên nhưng nay không còn (I used to smoke).\nbe used to + V-ing/N: đã quen với điều gì (I\'m used to getting up early).\nget used to + V-ing/N: dần trở nên quen (You\'ll get used to the noise).\nPhủ định: didn\'t use to + V.',
    patterns: ['S + used to + V', 'S + be used to + V-ing', 'S + get used to + V-ing'],
    examples: [
      { en: 'I used to live in Hanoi.', vi: 'Tôi từng sống ở Hà Nội.' },
      { en: "She isn't used to driving on the left.", vi: 'Cô ấy chưa quen lái xe bên trái.' },
    ],
  },

  {
    slug: 'modals-of-possibility',
    level: 4,
    titleEn: 'May, might, could for possibility',
    titleVi: 'May / might / could — khả năng có thể xảy ra',
    summaryVi: 'Nói điều có thể đúng hoặc có thể xảy ra, không chắc chắn.',
    explanationVi:
      'may / might / could + V: khả năng ở hiện tại hoặc tương lai (It might rain later).\nmight thường kém chắc chắn hơn may một chút.\nPhủ định khả năng: may not / might not (không dùng couldn\'t với nghĩa "có thể không").\nHỏi: Could it be…? / Do you think it might…?',
    patterns: ['S + may/might/could + V', 'S + may not/might not + V'],
    examples: [
      { en: 'Take an umbrella. It might rain.', vi: 'Mang ô đi. Có thể trời sẽ mưa.' },
      { en: "She may not come to the party.", vi: 'Có thể cô ấy sẽ không đến bữa tiệc.' },
    ],
  },
  {
    slug: 'reflexive-pronouns',
    level: 4,
    titleEn: 'Reflexive pronouns',
    titleVi: 'Đại từ phản thân (myself, yourself…)',
    summaryVi: 'Dùng khi chủ ngữ và tân ngữ là cùng một người, hoặc để nhấn mạnh.',
    explanationVi:
      'myself, yourself, himself, herself, itself, ourselves, yourselves, themselves.\nCùng một người: She hurt herself.\nNhấn mạnh "tự mình": I made this cake myself.\nby + đại từ phản thân = một mình: He lives by himself.',
    patterns: ['S + V + -self', 'S + V + O + -self (nhấn mạnh)', 'by + -self'],
    examples: [
      { en: 'Did you enjoy yourselves at the party?', vi: 'Các bạn có vui ở bữa tiệc không?' },
      { en: 'I fixed the bike myself.', vi: 'Tôi tự sửa chiếc xe đạp.' },
    ],
  },
  {
    slug: 'phrasal-verbs',
    level: 4,
    titleEn: 'Phrasal verbs',
    titleVi: 'Cụm động từ (phrasal verbs)',
    summaryVi: 'Động từ + giới từ/trạng từ tạo nghĩa mới: give up, look after, turn on…',
    explanationVi:
      'Nghĩa thường khác hẳn động từ gốc: give up = từ bỏ, look after = chăm sóc.\nLoại tách được: tân ngữ đứng giữa hoặc sau (turn the light off / turn off the light); nếu tân ngữ là đại từ thì BẮT BUỘC đứng giữa (turn it off).\nLoại không tách được: look after the kids, get on the bus.\nHọc theo cụm kèm câu ví dụ, không đoán nghĩa từ từng chữ.',
    patterns: ['V + particle + O', 'V + O (đại từ) + particle'],
    examples: [
      { en: "Don't give up! You can do it.", vi: 'Đừng bỏ cuộc! Bạn làm được mà.' },
      { en: 'Please turn it off before you leave.', vi: 'Làm ơn tắt nó đi trước khi bạn rời đi.' },
    ],
  },
  {
    slug: 'both-either-neither',
    level: 4,
    titleEn: 'Both, either, neither',
    titleVi: 'Both / either / neither',
    summaryVi: 'Nói về hai người/vật: cả hai, một trong hai, không cái nào.',
    explanationVi:
      'both (and): cả hai — Both answers are correct / both A and B.\neither (or): một trong hai — You can choose either colour / either A or B.\nneither (nor): không cái nào — Neither answer is correct / neither A nor B.\neither/neither + danh từ số ít; both + danh từ số nhiều.',
    patterns: ['both A and B', 'either A or B', 'neither A nor B'],
    examples: [
      { en: 'Both my parents are teachers.', vi: 'Cả bố và mẹ tôi đều là giáo viên.' },
      { en: 'Neither Tom nor Anna was at home.', vi: 'Cả Tom lẫn Anna đều không có ở nhà.' },
    ],
  },
  {
    slug: 'contrast-linkers',
    level: 4,
    titleEn: 'Although, even though, however',
    titleVi: 'Từ nối chỉ sự đối lập',
    summaryVi: 'Nối hai ý trái ngược trong cùng câu hoặc giữa hai câu.',
    explanationVi:
      'although / even though + mệnh đề: Although it was late, we kept working. (even though nhấn mạnh hơn).\nhowever đứng đầu câu thứ hai, có dấu phẩy: It was late. However, we kept working.\nKhông dùng but cùng although trong một câu (sai: Although…, but…).',
    patterns: ['Although + S + V, S + V', 'S + V. However, S + V'],
    examples: [
      { en: 'Although he was ill, he went to work.', vi: 'Dù bị ốm, anh ấy vẫn đi làm.' },
      { en: 'The hotel was cheap. However, it was very clean.', vi: 'Khách sạn rẻ. Tuy vậy, nó rất sạch sẽ.' },
    ],
  },
  {
    slug: 'indirect-questions',
    level: 4,
    titleEn: 'Indirect questions',
    titleVi: 'Câu hỏi gián tiếp (lịch sự)',
    summaryVi: 'Hỏi lịch sự hơn bằng Could you tell me… / Do you know… với trật tự câu khẳng định.',
    explanationVi:
      'Mở đầu: Could you tell me…, Do you know…, I wonder…\nSau đó dùng trật tự khẳng định, KHÔNG đảo trợ động từ: Where is the station? → Could you tell me where the station is?\nCâu hỏi Yes/No dùng if/whether: Do you know if the shop is open?',
    patterns: ['Could you tell me + wh- + S + V?', 'Do you know + if/whether + S + V?'],
    examples: [
      { en: 'Could you tell me where the bank is?', vi: 'Bạn có thể chỉ giúp tôi ngân hàng ở đâu không?' },
      { en: 'Do you know if the museum opens on Monday?', vi: 'Bạn có biết bảo tàng có mở cửa thứ Hai không?' },
    ],
  },

  // ---------- Level 5 · Upper-Intermediate ----------
  {
    slug: 'third-mixed-conditionals',
    level: 5,
    titleEn: 'Third and mixed conditionals',
    titleVi: 'Câu điều kiện loại 3 và điều kiện hỗn hợp',
    summaryVi: 'Nói về điều không có thật trong quá khứ và hệ quả của nó.',
    explanationVi:
      'Loại 3: If + had + V3, would have + V3 — giả định trái với quá khứ (If I had left earlier, I would have caught the train).\nHỗn hợp: điều kiện quá khứ, kết quả hiện tại: If + had + V3, would + V (If I had studied medicine, I would be a doctor now).\nCó thể thay would bằng could/might để giảm mức chắc chắn.',
    patterns: ['If + S + had + V3, S + would have + V3', 'If + S + had + V3, S + would + V (now)'],
    examples: [
      { en: "If you had told me, I would have helped you.", vi: 'Nếu bạn nói với tôi thì tôi đã giúp bạn rồi.' },
      { en: "If I hadn't missed the flight, I would be in Paris now.", vi: 'Nếu không lỡ chuyến bay thì giờ tôi đã ở Paris.' },
    ],
  },
  {
    slug: 'past-perfect',
    level: 5,
    titleEn: 'Past perfect',
    titleVi: 'Thì quá khứ hoàn thành',
    summaryVi: 'Hành động xảy ra trước một mốc/hành động khác trong quá khứ.',
    explanationVi:
      'Cấu trúc: had + V3.\nDùng khi kể chuyện quá khứ và cần quay ngược lại sự việc xảy ra trước đó (When I arrived, the film had already started).\nHay đi với: already, just, before, by the time, after.\nNếu thứ tự đã rõ nhờ before/after, có thể dùng quá khứ đơn cho cả hai.',
    patterns: ['S + had + V3', 'By the time + S + V2, S + had + V3'],
    examples: [
      { en: 'When we got to the station, the train had left.', vi: 'Khi chúng tôi tới ga thì tàu đã chạy mất.' },
      { en: "She had never seen snow before she moved to Canada.", vi: 'Trước khi chuyển tới Canada, cô ấy chưa từng thấy tuyết.' },
    ],
  },
  {
    slug: 'modals-of-deduction',
    level: 5,
    titleEn: 'Modals of deduction',
    titleVi: 'Động từ khuyết thiếu chỉ suy đoán',
    summaryVi: 'must/might/can\'t để suy luận về hiện tại; thêm have + V3 cho quá khứ.',
    explanationVi:
      'Hiện tại: must + V (chắc chắn là), might/may/could + V (có lẽ), can\'t + V (chắc chắn không).\nQuá khứ: must have + V3, might have + V3, can\'t/couldn\'t have + V3.\nKhông dùng mustn\'t để suy đoán phủ định — dùng can\'t.',
    patterns: ['S + must/might/can\'t + V', 'S + must/might/can\'t + have + V3'],
    examples: [
      { en: "He isn't answering — he must be asleep.", vi: 'Anh ấy không nghe máy — chắc là đang ngủ.' },
      { en: "She can't have seen us; she was facing the other way.", vi: 'Cô ấy không thể đã thấy chúng ta; cô ấy quay mặt hướng khác.' },
    ],
  },
  {
    slug: 'wish-if-only',
    level: 5,
    titleEn: 'Wish and if only',
    titleVi: 'Câu ước với wish / if only',
    summaryVi: 'Bày tỏ mong muốn trái với thực tế hiện tại hoặc tiếc nuối về quá khứ.',
    explanationVi:
      'Ước hiện tại: wish + quá khứ đơn (I wish I knew the answer).\nTiếc quá khứ: wish + had + V3 (I wish I had studied harder).\nPhàn nàn về hành vi người khác: wish + would + V (I wish you would stop talking).\nIf only mang nghĩa giống wish nhưng cảm xúc mạnh hơn.',
    patterns: ['S + wish + S + V2', 'S + wish + S + had + V3', 'If only + S + V2/had V3'],
    examples: [
      { en: 'I wish I lived closer to the sea.', vi: 'Ước gì tôi sống gần biển hơn.' },
      { en: "If only I hadn't spent all my money!", vi: 'Giá mà tôi đã không tiêu hết tiền!' },
    ],
  },
  {
    slug: 'causative',
    level: 5,
    titleEn: 'Causative: have / get something done',
    titleVi: 'Thể nhờ bảo (have/get something done)',
    summaryVi: 'Nói việc được người khác làm cho mình (thường là dịch vụ).',
    explanationVi:
      'have + O + V3 / get + O + V3: nhờ ai đó làm việc gì (I had my hair cut).\nget trang trọng kém hơn have, hay dùng trong văn nói.\nhave + người + V / get + người + to V: bảo/nhờ một người cụ thể làm (I\'ll get Tom to fix it).\nCũng dùng cho việc không may xảy ra: She had her phone stolen.',
    patterns: ['S + have/get + O + V3', 'S + have + someone + V', 'S + get + someone + to V'],
    examples: [
      { en: 'We are having our house painted next week.', vi: 'Tuần sau chúng tôi sẽ thuê người sơn nhà.' },
      { en: 'I need to get my laptop repaired.', vi: 'Tôi cần mang máy tính đi sửa.' },
    ],
  },
  {
    slug: 'cleft-sentences',
    level: 5,
    titleEn: 'Cleft sentences',
    titleVi: 'Câu chẻ (nhấn mạnh với It is… / What…)',
    summaryVi: 'Tách câu để nhấn mạnh một thành phần cụ thể.',
    explanationVi:
      'It is/was + phần nhấn mạnh + that/who + phần còn lại (It was Mai who called you).\nWhat + mệnh đề + is/was + phần nhấn mạnh (What I need is a long holiday).\nDùng khi muốn sửa thông tin sai hoặc làm nổi bật ý chính trong văn nói và viết.',
    patterns: ['It is/was + X + that/who + …', 'What + S + V + is/was + X'],
    examples: [
      { en: "It was in Da Lat that they first met.", vi: 'Chính ở Đà Lạt họ đã gặp nhau lần đầu.' },
      { en: 'What I really want is some peace and quiet.', vi: 'Điều tôi thực sự muốn là chút yên tĩnh.' },
    ],
  },

  {
    slug: 'past-perfect-continuous',
    level: 5,
    titleEn: 'Past perfect continuous',
    titleVi: 'Thì quá khứ hoàn thành tiếp diễn',
    summaryVi: 'Hành động đã kéo dài một thời gian TRƯỚC một mốc quá khứ.',
    explanationVi:
      'Cấu trúc: had been + V-ing.\nNhấn mạnh quá trình kéo dài trước một việc khác trong quá khứ (She had been working there for ten years when she got promoted).\nGiải thích nguyên nhân trong quá khứ: He was tired because he had been running.',
    patterns: ['S + had been + V-ing (+ for/since …)'],
    examples: [
      { en: 'We had been waiting for an hour when the bus finally came.', vi: 'Chúng tôi đã chờ suốt một tiếng thì xe buýt mới tới.' },
      { en: 'Her eyes were red because she had been crying.', vi: 'Mắt cô ấy đỏ vì cô ấy đã khóc.' },
    ],
  },
  {
    slug: 'impersonal-passive',
    level: 5,
    titleEn: 'Impersonal passive (It is said that…)',
    titleVi: 'Bị động khách quan (It is said that…)',
    summaryVi: 'Thuật lại ý kiến chung mà không nói ai nói — hay dùng trong tin tức.',
    explanationVi:
      'It + be + V3 (said/believed/thought/reported) + that + mệnh đề: It is said that he is very rich.\nHoặc: S + be + V3 + to V: He is said to be very rich.\nViệc ở quá khứ: S + be + V3 + to have V3: She is believed to have left the country.',
    patterns: ['It is said/believed that + S + V', 'S + is said/believed + to V / to have V3'],
    examples: [
      { en: 'It is believed that the castle is 800 years old.', vi: 'Người ta tin rằng toà lâu đài đã 800 năm tuổi.' },
      { en: 'The singer is reported to have cancelled the tour.', vi: 'Có tin nói rằng ca sĩ đã huỷ chuyến lưu diễn.' },
    ],
  },
  {
    slug: 'had-better-would-rather',
    level: 5,
    titleEn: 'Had better and would rather',
    titleVi: 'Had better và would rather',
    summaryVi: 'had better = nên (kẻo có hậu quả); would rather = thích … hơn.',
    explanationVi:
      'had better + V: lời khuyên mạnh, ngụ ý nếu không làm sẽ có rắc rối (You\'d better hurry).\nPhủ định: had better not + V.\nwould rather + V (+ than + V): I\'d rather stay home than go out.\nwould rather + S + V2: muốn người khác làm gì (I\'d rather you didn\'t smoke here).',
    patterns: ["S + 'd better (not) + V", "S + 'd rather + V (+ than V)", "S + 'd rather + S + V2"],
    examples: [
      { en: "You'd better take a coat. It's freezing outside.", vi: 'Bạn nên mang áo khoác. Ngoài trời lạnh cóng.' },
      { en: "I'd rather walk than take a taxi.", vi: 'Tôi thà đi bộ còn hơn đi taxi.' },
    ],
  },
  {
    slug: 'emphatic-do',
    level: 5,
    titleEn: 'Emphatic do / does / did',
    titleVi: 'Nhấn mạnh với do / does / did',
    summaryVi: 'Thêm do/does/did trước động từ trong câu khẳng định để nhấn mạnh.',
    explanationVi:
      'Dùng để khẳng định mạnh, phản bác ý ngược lại: I did lock the door!\nThể hiện cảm xúc: I do love this song.\nMệnh lệnh lịch sự, nhiệt tình: Do sit down.\nĐộng từ sau do/does/did luôn ở dạng nguyên mẫu.',
    patterns: ['S + do/does/did + V (nguyên mẫu)'],
    examples: [
      { en: '"You didn\'t call me." — "I did call you, twice!"', vi: '"Bạn không gọi cho tôi." — "Tôi có gọi mà, hai lần!"' },
      { en: 'She does work hard, even if it does not show.', vi: 'Cô ấy thật sự làm việc chăm chỉ, dù không thể hiện ra.' },
    ],
  },
  {
    slug: 'future-in-the-past',
    level: 5,
    titleEn: 'Future in the past',
    titleVi: 'Tương lai trong quá khứ',
    summaryVi: 'Nói điều đã dự định/dự đoán tại một thời điểm quá khứ: was going to, would.',
    explanationVi:
      'was/were going to + V: dự định trong quá khứ, thường không thành (I was going to call you, but I forgot).\nwould + V: dự đoán hoặc lời hứa trong quá khứ, hay gặp trong câu tường thuật (He said he would help).\nwas/were about to + V: sắp sửa làm thì có chuyện xảy ra.',
    patterns: ['S + was/were going to + V', 'S + said + S + would + V', 'S + was/were about to + V'],
    examples: [
      { en: 'I was going to buy that dress, but it sold out.', vi: 'Tôi đã định mua cái váy đó nhưng nó bán hết rồi.' },
      { en: 'We were about to leave when it started to rain.', vi: 'Chúng tôi vừa định đi thì trời bắt đầu mưa.' },
    ],
  },
  {
    slug: 'reduced-relative-clauses',
    level: 5,
    titleEn: 'Reduced relative clauses',
    titleVi: 'Rút gọn mệnh đề quan hệ',
    summaryVi: 'Bỏ who/which + be, dùng V-ing (chủ động) hoặc V3 (bị động) ngay sau danh từ.',
    explanationVi:
      'Chủ động → V-ing: The man who is standing there → The man standing there.\nBị động → V3: The car which was stolen yesterday → The car stolen yesterday.\nSau the first/the last/the only có thể dùng to V: She was the first person to arrive.',
    patterns: ['N + V-ing …', 'N + V3 …', 'the first/last/only + N + to V'],
    examples: [
      { en: 'Students wanting to join the club should sign up today.', vi: 'Sinh viên muốn tham gia câu lạc bộ nên đăng ký hôm nay.' },
      { en: 'Most of the goods made in this factory are exported.', vi: 'Phần lớn hàng hoá sản xuất ở nhà máy này được xuất khẩu.' },
    ],
  },

  // ---------- Level 6 · Advanced ----------
  {
    slug: 'negative-inversion',
    level: 6,
    titleEn: 'Inversion after negative adverbials',
    titleVi: 'Đảo ngữ với trạng từ phủ định',
    summaryVi: 'Đưa trạng từ phủ định/hạn chế lên đầu câu rồi đảo trợ động từ để nhấn mạnh.',
    explanationVi:
      'Các cụm thường gặp: Never, Rarely, Seldom, Hardly … when, No sooner … than, Not only … but also, Under no circumstances, Only then.\nSau cụm này, đảo trợ động từ lên trước chủ ngữ như câu hỏi (Never have I seen…).\nPhong cách trang trọng, hay gặp trong văn viết và bài nói học thuật.',
    patterns: ['Never/Rarely + aux + S + V', 'No sooner + had + S + V3 + than …', 'Not only + aux + S + V, but … also …'],
    examples: [
      { en: 'Never have I seen such a beautiful sunset.', vi: 'Chưa bao giờ tôi thấy hoàng hôn đẹp như vậy.' },
      { en: 'No sooner had we sat down than the phone rang.', vi: 'Chúng tôi vừa ngồi xuống thì điện thoại reo.' },
    ],
  },
  {
    slug: 'subjunctive',
    level: 6,
    titleEn: 'The subjunctive',
    titleVi: 'Thức giả định',
    summaryVi: 'Dùng động từ nguyên mẫu sau các động từ/tính từ chỉ yêu cầu, đề nghị, tầm quan trọng.',
    explanationVi:
      'Sau suggest, recommend, insist, demand, request + that: động từ ở dạng nguyên mẫu cho mọi ngôi (I suggest that he see a doctor).\nSau It is essential/important/vital that … cũng vậy.\nPhủ định: that + S + not + V.\nTiếng Anh-Anh thân mật có thể thay bằng should + V.',
    patterns: ['S + suggest/insist + that + S + V (nguyên mẫu)', 'It is essential that + S + V'],
    examples: [
      { en: 'The doctor recommended that she rest for a week.', vi: 'Bác sĩ khuyên cô ấy nên nghỉ ngơi một tuần.' },
      { en: 'It is vital that every employee be informed.', vi: 'Điều tối quan trọng là mọi nhân viên đều được thông báo.' },
    ],
  },
  {
    slug: 'participle-clauses',
    level: 6,
    titleEn: 'Participle clauses',
    titleVi: 'Mệnh đề phân từ',
    summaryVi: 'Rút gọn mệnh đề bằng V-ing, V3 hoặc Having V3 để câu gọn và trang trọng hơn.',
    explanationVi:
      'V-ing: hành động chủ động, cùng lúc (Walking down the street, I saw an old friend).\nV3: nghĩa bị động (Built in 1890, the house is now a museum).\nHaving + V3: hành động xảy ra trước (Having finished the report, she went home).\nChủ ngữ của mệnh đề phân từ phải trùng với chủ ngữ mệnh đề chính.',
    patterns: ['V-ing …, S + V', 'V3 …, S + V', 'Having + V3 …, S + V'],
    examples: [
      { en: 'Having lived abroad for years, he speaks three languages.', vi: 'Đã sống ở nước ngoài nhiều năm, anh ấy nói được ba thứ tiếng.' },
      { en: 'Written in simple English, the book is easy to follow.', vi: 'Được viết bằng tiếng Anh đơn giản, cuốn sách rất dễ hiểu.' },
    ],
  },
  {
    slug: 'future-perfect-continuous',
    level: 6,
    titleEn: 'Future continuous and future perfect',
    titleVi: 'Tương lai tiếp diễn và tương lai hoàn thành',
    summaryVi: 'Nói về việc đang diễn ra hoặc đã hoàn thành tại một mốc trong tương lai.',
    explanationVi:
      'Tương lai tiếp diễn: will be + V-ing — đang diễn ra tại thời điểm tương lai (This time tomorrow I\'ll be flying to Tokyo).\nTương lai hoàn thành: will have + V3 — sẽ xong trước một mốc (By 2030, I will have paid off the loan).\nTương lai hoàn thành tiếp diễn: will have been + V-ing — nhấn mạnh độ dài tính tới mốc đó.',
    patterns: ['S + will be + V-ing', 'By + mốc, S + will have + V3', 'S + will have been + V-ing + for …'],
    examples: [
      { en: "By next June, I will have graduated.", vi: 'Đến tháng Sáu năm sau, tôi sẽ tốt nghiệp xong.' },
      { en: "Don't call at nine — I'll be having dinner.", vi: 'Đừng gọi lúc chín giờ — lúc đó tôi đang ăn tối.' },
    ],
  },
  {
    slug: 'advanced-linking',
    level: 6,
    titleEn: 'Advanced linking words',
    titleVi: 'Từ nối nâng cao',
    summaryVi: 'Diễn đạt nhượng bộ, đối lập, kết quả một cách chính xác và trang trọng.',
    explanationVi:
      'Nhượng bộ: although/even though + mệnh đề; despite/in spite of + N/V-ing; albeit + cụm từ (a slow, albeit steady, recovery).\nĐối lập: whereas/while (so sánh hai vế), however/nevertheless (đầu câu, sau dấu chấm hoặc chấm phẩy).\nKết quả: consequently, therefore, hence, thus.\nChú ý dấu câu: however đứng giữa hai mệnh đề cần dấu chấm phẩy trước và dấu phẩy sau.',
    patterns: ['Despite + N/V-ing, S + V', 'S + V; however, S + V', 'S + V, whereas S + V'],
    examples: [
      { en: 'Despite feeling tired, she finished the marathon.', vi: 'Dù thấy mệt, cô ấy vẫn chạy hết chặng marathon.' },
      { en: 'Prices rose sharply; consequently, sales fell.', vi: 'Giá tăng mạnh; do đó, doanh số giảm.' },
    ],
  },
  {
    slug: 'ellipsis-substitution',
    level: 6,
    titleEn: 'Ellipsis and substitution',
    titleVi: 'Tỉnh lược và thay thế',
    summaryVi: 'Lược bỏ hoặc thay thế phần đã nói để tránh lặp, giúp câu tự nhiên.',
    explanationVi:
      'Thay thế bằng so / not: I think so. I hope not.\nThay động từ bằng do / do so: She wanted to leave early, and so did I.\nLược sau trợ động từ: "Can you swim?" — "Yes, I can."\nLược sau to: I didn\'t want to go, but I had to.\none/ones thay cho danh từ đếm được: I\'ll take the red one.',
    patterns: ['think/hope/expect + so/not', 'so/neither + aux + S', '… but I had to.'],
    examples: [
      { en: '"Will it rain tomorrow?" — "I hope not."', vi: '"Mai trời có mưa không?" — "Hy vọng là không."' },
      { en: "He loves jazz, and so does his wife.", vi: 'Anh ấy thích nhạc jazz, và vợ anh ấy cũng vậy.' },
    ],
  },
  {
    slug: 'conditional-inversion',
    level: 6,
    titleEn: 'Inverted conditionals',
    titleVi: 'Đảo ngữ câu điều kiện',
    summaryVi: 'Bỏ if, đảo should/were/had lên đầu — trang trọng hơn.',
    explanationVi:
      'Loại 1: Should + S + V (Should you need help, call me = If you need…).\nLoại 2: Were + S + to V / Were + S + … (Were I rich, I would travel = If I were rich…).\nLoại 3: Had + S + V3 (Had I known, I would have come = If I had known…).\nPhủ định: Had I not seen it… (không viết tắt Hadn\'t I…).',
    patterns: ['Should + S + V, …', 'Were + S + (to V), …', 'Had + S + V3, … would have V3'],
    examples: [
      { en: 'Had we left earlier, we would have caught the train.', vi: 'Giá mà chúng tôi đi sớm hơn thì đã kịp chuyến tàu.' },
      { en: 'Should you have any questions, please contact us.', vi: 'Nếu có bất kỳ câu hỏi nào, xin vui lòng liên hệ chúng tôi.' },
    ],
  },
  {
    slug: 'fronting',
    level: 6,
    titleEn: 'Fronting for emphasis',
    titleVi: 'Đưa thành phần lên đầu câu để nhấn mạnh',
    summaryVi: 'Đặt tân ngữ, tính từ hoặc trạng ngữ lên đầu để tạo điểm nhấn, liên kết ý.',
    explanationVi:
      'Tân ngữ: That film I will never forget.\nTính từ + as/though: Tired as she was, she kept going (= Although she was tired).\nTrạng ngữ nơi chốn + động từ: Into the room walked a stranger.\nPhong cách văn viết, kể chuyện; không lạm dụng trong hội thoại hằng ngày.',
    patterns: ['O + S + V', 'Adj + as + S + be, …', 'Trạng ngữ nơi chốn + V + S'],
    examples: [
      { en: 'Strange as it may seem, I actually enjoy exams.', vi: 'Nghe có vẻ lạ, nhưng tôi thật sự thích đi thi.' },
      { en: 'Down the hill rolled the ball.', vi: 'Quả bóng lăn xuống đồi.' },
    ],
  },
  {
    slug: 'nominalisation',
    level: 6,
    titleEn: 'Nominalisation',
    titleVi: 'Danh từ hoá',
    summaryVi: 'Biến động từ/tính từ thành danh từ để câu học thuật, súc tích hơn.',
    explanationVi:
      'Động từ → danh từ: decide → decision, improve → improvement, fail → failure.\nVí dụ: Prices increased rapidly, which worried investors → The rapid increase in prices worried investors.\nHay gặp trong bài viết IELTS, báo cáo; giúp câu khách quan và gọn hơn.',
    patterns: ['The + N (+ of/in …) + V', 'Adj + N thay cho V + Adv'],
    examples: [
      { en: 'The introduction of the new law led to a reduction in crime.', vi: 'Việc ban hành luật mới đã giúp giảm tội phạm.' },
      { en: 'Her refusal to cooperate surprised everyone.', vi: 'Việc cô ấy từ chối hợp tác khiến mọi người bất ngờ.' },
    ],
  },
  {
    slug: 'hedging',
    level: 6,
    titleEn: 'Hedging language',
    titleVi: 'Ngôn ngữ rào đón (nói giảm độ chắc chắn)',
    summaryVi: 'Dùng seem, appear, tend to, may, likely… để nhận định thận trọng.',
    explanationVi:
      'Động từ: seem/appear + to V (Prices appear to be rising).\nTính từ/trạng từ: likely, possibly, arguably, to some extent.\nCụm: It could be argued that…, There is some evidence that…\nDùng trong văn học thuật và tranh luận lịch sự, tránh khẳng định tuyệt đối.',
    patterns: ['S + seem/appear/tend + to V', 'It could be argued that + S + V', 'S + be + likely + to V'],
    examples: [
      { en: 'Young people tend to spend more time online.', vi: 'Giới trẻ có xu hướng dành nhiều thời gian trên mạng hơn.' },
      { en: 'It could be argued that the policy has failed.', vi: 'Có thể cho rằng chính sách này đã thất bại.' },
    ],
  },
  {
    slug: 'unreal-past',
    level: 6,
    titleEn: "Unreal past: it's time, as if, suppose",
    titleVi: 'Quá khứ giả định (It\'s time, as if, suppose…)',
    summaryVi: 'Dùng thì quá khứ để nói điều không có thật hoặc chưa xảy ra ở hiện tại.',
    explanationVi:
      'It\'s (high) time + S + V2: đáng lẽ đã phải làm rồi (It\'s time we left).\nas if / as though + V2: như thể (He talks as if he knew everything).\nSuppose / Imagine + S + V2: giả sử (Suppose you won the lottery…).\nVới to be thường dùng were cho mọi ngôi trong văn trang trọng.',
    patterns: ["It's (high) time + S + V2", 'S + V + as if + S + V2', 'Suppose + S + V2, …'],
    examples: [
      { en: "It's high time you started revising.", vi: 'Đã đến lúc bạn phải bắt đầu ôn bài rồi.' },
      { en: 'She looks as if she had seen a ghost.', vi: 'Cô ấy trông như thể vừa nhìn thấy ma.' },
    ],
  },
  {
    slug: 'comparative-correlatives',
    level: 6,
    titleEn: 'The more …, the more …',
    titleVi: 'So sánh kép (càng … càng …)',
    summaryVi: 'Hai vế so sánh hơn đi cùng nhau: The + so sánh hơn …, the + so sánh hơn …',
    explanationVi:
      'The + so sánh hơn + S + V, the + so sánh hơn + S + V: The harder you work, the more you earn.\nCó thể rút gọn khi rõ nghĩa: The sooner, the better.\nKhác với so sánh tăng dần: more and more / bigger and bigger (ngày càng…).',
    patterns: ['The + comparative + S + V, the + comparative + S + V', 'Adj-er and Adj-er / more and more + Adj'],
    examples: [
      { en: 'The more you practise, the more confident you become.', vi: 'Càng luyện tập nhiều, bạn càng tự tin hơn.' },
      { en: 'English is becoming more and more important.', vi: 'Tiếng Anh ngày càng trở nên quan trọng.' },
    ],
  },
];

/** By default only missing points are created, so edits made in /admin
 * survive a re-seed. `overwrite` rewrites every point from this file. */
export async function seedGrammar(
  prisma: PrismaClient,
  { overwrite = false }: { overwrite?: boolean } = {},
): Promise<void> {
  let n = 0;
  for (const g of GRAMMAR) {
    const data = {
      level: g.level,
      orderIndex: n,
      titleVi: g.titleVi,
      titleEn: g.titleEn,
      summaryVi: g.summaryVi,
      explanationVi: g.explanationVi,
      patterns: g.patterns,
      examples: g.examples,
    };
    await prisma.grammarPoint.upsert({
      where: { slug: g.slug },
      create: { slug: g.slug, ...data },
      update: overwrite ? data : {},
    });
    n += 1;
  }
  console.log(
    overwrite
      ? `  ✓ ${n} điểm ngữ pháp (ghi đè từ file)`
      : `  ✓ ${n} điểm ngữ pháp (chỉ tạo điểm còn thiếu — SEED_GRAMMAR_OVERWRITE=true để ghi đè)`,
  );
}
