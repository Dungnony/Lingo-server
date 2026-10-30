/**
 * Topics used to group words into lessons. Gemini must pick one of these
 * keys for every word; lessons follow this order inside a level.
 */
export const TOPICS = {
  greetings: 'Chào hỏi & giao tiếp',
  people: 'Con người & gia đình',
  body: 'Cơ thể & sức khoẻ',
  feelings: 'Cảm xúc & tính cách',
  home: 'Nhà cửa & đồ dùng',
  food: 'Ăn uống',
  clothes: 'Quần áo & mua sắm',
  time: 'Thời gian & lịch',
  numbers: 'Số đếm & đo lường',
  places: 'Địa điểm & thành phố',
  travel: 'Du lịch & giao thông',
  nature: 'Thiên nhiên & thời tiết',
  animals: 'Động vật',
  school: 'Trường học & học tập',
  work: 'Công việc & nghề nghiệp',
  hobbies: 'Sở thích & giải trí',
  sports: 'Thể thao',
  technology: 'Công nghệ & truyền thông',
  arts: 'Nghệ thuật & văn hoá',
  business: 'Kinh tế & kinh doanh',
  society: 'Xã hội & chính trị',
  science: 'Khoa học',
  actions: 'Hành động thường ngày',
  describing: 'Miêu tả & tính chất',
  function_words: 'Từ chức năng',
  abstract: 'Khái niệm trừu tượng',
  other: 'Từ vựng chung',
} as const;

export type TopicKey = keyof typeof TOPICS;

export const TOPIC_KEYS = Object.keys(TOPICS) as TopicKey[];

export function isTopicKey(value: unknown): value is TopicKey {
  return typeof value === 'string' && Object.hasOwn(TOPICS, value);
}
