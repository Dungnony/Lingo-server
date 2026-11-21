import { PrismaClient, VideoKind } from '../../src/generated/prisma/client';

interface SeedVideo {
  youtubeId: string;
  title: string;
  titleEn: string;
  description: string;
  level: number;
  kind: VideoKind;
  author: string;
  sortOrder: number;
  lines: { startMs: number; en: string; vi: string }[];
}

const SAMPLE_VIDEOS: SeedVideo[] = [
  {
    youtubeId: 'M7lc1UVf-VE',
    title: 'Giao tiếp hàng ngày: Tự giới thiệu bản thân thật tự nhiên',
    titleEn: 'Daily English: Introducing Yourself Naturally',
    description:
      'Mẫu hội thoại ngắn giúp người mới bắt đầu làm quen với cách chào hỏi, giới thiệu công việc và sở thích bằng tiếng Anh tự nhiên.',
    level: 1,
    kind: VideoKind.DIALOGUE,
    author: 'Lingo English Studio',
    sortOrder: 1,
    lines: [
      {
        startMs: 1000,
        en: 'Hi everyone, welcome back to our daily English practice.',
        vi: 'Chào mọi người, chào mừng quay lại với buổi luyện tiếng Anh hàng ngày của chúng ta.',
      },
      {
        startMs: 5500,
        en: 'Today we will learn how to introduce yourself in a friendly way.',
        vi: 'Hôm nay chúng ta sẽ học cách tự giới thiệu bản thân một cách thân thiện.',
      },
      {
        startMs: 10500,
        en: 'My name is Anna, and I work as a software designer.',
        vi: 'Tên mình là Anna, và mình làm nghề thiết kế phần mềm.',
      },
      {
        startMs: 15500,
        en: 'In my free time, I enjoy reading books and cooking simple meals.',
        vi: 'Vào thời gian rảnh, mình thích đọc sách và nấu những bữa ăn đơn giản.',
      },
      {
        startMs: 21000,
        en: 'I started learning English because I want to travel and make new friends.',
        vi: 'Mình bắt đầu học tiếng Anh vì muốn đi du lịch và kết thêm nhiều bạn mới.',
      },
      {
        startMs: 27000,
        en: 'Now it is your turn to share a few sentences about yourself.',
        vi: 'Bây giờ đến lượt bạn chia sẻ vài câu về bản thân mình nhé.',
      },
    ],
  },
  {
    youtubeId: 'arj7oStGLkU',
    title: 'Bên trong tâm trí của một người hay trì hoãn — Tim Urban',
    titleEn: 'Inside the Mind of a Master Procrastinator — TED',
    description:
      'Bài nói TED nổi tiếng và hài hước của Tim Urban về thói quen nước đến chân mới nhảy và cách chúng ta sử dụng thời gian.',
    level: 3,
    kind: VideoKind.PODCAST,
    author: 'TED · Tim Urban',
    sortOrder: 2,
    lines: [
      {
        startMs: 12000,
        en: 'So in college, I was a government major, which means I had to write a lot of papers.',
        vi: 'Hồi đại học, tôi học chuyên ngành chính trị, nghĩa là tôi phải viết rất nhiều bài luận.',
      },
      {
        startMs: 18500,
        en: 'Now, when a normal student writes a paper, they might spread the work out a little like this.',
        vi: 'Khi một sinh viên bình thường viết bài, họ thường chia nhỏ công việc đều ra như thế này.',
      },
      {
        startMs: 25000,
        en: 'So, you know, you get started maybe a little slowly, but you get enough done in the first week.',
        vi: 'Bạn có thể khởi đầu hơi chậm một chút, nhưng vẫn làm được kha khá trong tuần đầu tiên.',
      },
      {
        startMs: 31500,
        en: 'And then everything is done, and you stay civilised. That is not what I would do.',
        vi: 'Rồi mọi thứ hoàn tất êm đẹp. Nhưng đó hoàn toàn không phải là cách tôi làm.',
      },
      {
        startMs: 38000,
        en: 'The procrastinator has an instant gratification monkey inside their brain.',
        vi: 'Người hay trì hoãn có một chú khỉ thích hưởng thụ tức thời ở trong đầu.',
      },
      {
        startMs: 45000,
        en: 'The monkey only cares about two things: easy and fun in the present moment.',
        vi: 'Chú khỉ đó chỉ quan tâm tới hai điều: dễ dàng và vui vẻ ngay trong khoảnh khắc hiện tại.',
      },
      {
        startMs: 52500,
        en: 'We need to think about what we are really procrastinating on before we run out of time.',
        vi: 'Chúng ta cần suy ngẫm xem mình thực sự đang trì hoãn điều gì trước khi thời gian cạn kiệt.',
      },
    ],
  },
  {
    youtubeId: 'eIho2S0ZahI',
    title: 'Cách nói để mọi người muốn lắng nghe bạn — Julian Treasure',
    titleEn: 'How to Speak So That People Want to Listen — TED',
    description:
      'Chuyên gia âm thanh Julian Treasure chia sẻ những thói quen cần tránh và 4 nền tảng giúp giọng nói của bạn truyền cảm hứng.',
    level: 4,
    kind: VideoKind.LESSON,
    author: 'TED · Julian Treasure',
    sortOrder: 3,
    lines: [
      {
        startMs: 13000,
        en: 'The human voice: it is the instrument we all play, and it is the most powerful sound in the world.',
        vi: 'Giọng nói con người là nhạc cụ mà tất cả chúng ta đều chơi, và là âm thanh mạnh mẽ nhất thế giới.',
      },
      {
        startMs: 21000,
        en: 'It is the only one that can start a war or say "I love you."',
        vi: 'Đó là âm thanh duy nhất có thể châm ngòi một cuộc chiến hoặc nói lời "Anh yêu em."',
      },
      {
        startMs: 26500,
        en: 'And yet many people have the experience that when they speak, people do not listen to them.',
        vi: 'Thế nhưng rất nhiều người từng trải qua cảm giác khi mình nói, chẳng ai chịu lắng nghe.',
      },
      {
        startMs: 34000,
        en: 'First, honesty: being true in what you say, being straight and clear.',
        vi: 'Đầu tiên là sự chân thật: nói đúng sự thật, thẳng thắn và rõ ràng.',
      },
      {
        startMs: 41000,
        en: 'Second, authenticity: just being yourself, standing in your own truth.',
        vi: 'Thứ hai là sự chân thành: hãy là chính mình, đứng vững trên giá trị của bản thân.',
      },
      {
        startMs: 48000,
        en: 'Third, integrity: doing what you say, so people can actually trust your words.',
        vi: 'Thứ ba là sự chính trực: làm đúng những gì bạn nói để mọi người có thể tin tưởng lời nói của bạn.',
      },
    ],
  },
  {
    youtubeId: 'UF8uR6Z6KLc',
    title:
      'Bài phát biểu tại Đại học Stanford của Steve Jobs: Hãy cứ khát khao',
    titleEn: 'Steve Jobs’ 2005 Stanford Commencement Address',
    description:
      'Ba câu chuyện cuộc đời của Steve Jobs về việc kết nối những dấu chấm, tình yêu với công việc và sống trọn vẹn từng ngày.',
    level: 4,
    kind: VideoKind.STORY,
    author: 'Stanford · Steve Jobs',
    sortOrder: 4,
    lines: [
      {
        startMs: 22000,
        en: 'I am honored to be with you today at your commencement from one of the finest universities in the world.',
        vi: 'Tôi rất vinh dự được có mặt cùng các bạn hôm nay trong lễ tốt nghiệp tại một trong những trường đại học tốt nhất thế giới.',
      },
      {
        startMs: 31000,
        en: 'Today I want to tell you three stories from my life. That is it. No big deal. Just three stories.',
        vi: 'Hôm nay tôi muốn kể cho các bạn nghe ba câu chuyện từ cuộc đời mình. Chỉ vậy thôi, ba câu chuyện.',
      },
      {
        startMs: 40000,
        en: 'You cannot connect the dots looking forward; you can only connect them looking backward.',
        vi: 'Bạn không thể kết nối các dấu chấm khi nhìn về phía trước; bạn chỉ có thể kết nối chúng khi nhìn lại phía sau.',
      },
      {
        startMs: 48000,
        en: 'So you have to trust that the dots will somehow connect in your future.',
        vi: 'Vì vậy bạn phải tin tưởng rằng những dấu chấm ấy bằng cách nào đó sẽ kết nối lại trong tương lai.',
      },
      {
        startMs: 56000,
        en: 'Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.',
        vi: 'Công việc sẽ chiếm một phần lớn cuộc đời bạn, và cách duy nhất để thực sự hài lòng là làm những gì bạn tin là tuyệt vời.',
      },
      {
        startMs: 66000,
        en: 'Stay hungry. Stay foolish.',
        vi: 'Hãy cứ khát khao. Hãy cứ dại khờ.',
      },
    ],
  },
  {
    youtubeId: 'hiiEeMN7vbQ',
    title: 'Tư duy phát triển: Sức mạnh của việc tin rằng bạn có thể tiến bộ',
    titleEn: 'The Power of Believing That You Can Improve — Carol Dweck',
    description:
      'Nhà tâm lý học Carol Dweck giải thích sự khác biệt giữa "chưa làm được" và "không làm được" trong hành trình học tập.',
    level: 5,
    kind: VideoKind.LESSON,
    author: 'TED · Carol Dweck',
    sortOrder: 5,
    lines: [
      {
        startMs: 14000,
        en: 'The power of yet. I heard about a high school in Chicago where students had to pass a certain number of courses to graduate.',
        vi: 'Sức mạnh của từ "chưa". Tôi từng nghe về một trường trung học ở Chicago nơi học sinh phải hoàn thành đủ số môn để tốt nghiệp.',
      },
      {
        startMs: 23000,
        en: 'And if they did not pass a course, they got the grade "Not Yet."',
        vi: 'Và nếu chưa qua được một môn, các em nhận được đánh giá là "Chưa đạt" thay vì "Trượt".',
      },
      {
        startMs: 29500,
        en: 'I thought that was fantastic, because if you get a failing grade, you think, I am nothing, I am nowhere.',
        vi: 'Tôi nghĩ điều đó thật tuyệt vời, vì nếu nhận điểm trượt, bạn sẽ nghĩ mình thất bại và chẳng đi đến đâu.',
      },
      {
        startMs: 38000,
        en: 'But if you get the grade "Not Yet," you understand that you are on a learning curve.',
        vi: 'Nhưng nếu nhận đánh giá "Chưa đạt", bạn hiểu rằng mình đang trên một đường cong học tập.',
      },
      {
        startMs: 45500,
        en: 'It gives you a path into the future instead of a dead end.',
        vi: 'Nó mở ra cho bạn một con đường hướng tới tương lai thay vì một ngõ cụt.',
      },
    ],
  },
  {
    youtubeId: 'P_6vDLq64gE',
    title: 'Giao tiếp nơi công sở: Đặt đồ uống và trò chuyện nhỏ ở quán cà phê',
    titleEn: 'Everyday English: Ordering Coffee and Small Talk',
    description:
      'Luyện nghe các mẫu câu ngắn gọn, lịch sự khi gọi đồ uống, hỏi giá và trò chuyện xã giao hàng ngày.',
    level: 2,
    kind: VideoKind.DIALOGUE,
    author: 'Lingo Daily Conversations',
    sortOrder: 6,
    lines: [
      {
        startMs: 2000,
        en: 'Good morning! Can I get a medium iced latte with oat milk, please?',
        vi: 'Chào buổi sáng! Cho mình một ly latte đá cỡ vừa dùng sữa yến mạch nhé?',
      },
      {
        startMs: 7500,
        en: 'Sure thing. Would you like anything to eat with that today?',
        vi: 'Được chứ. Hôm nay bạn có muốn dùng thêm đồ ăn nhẹ gì kèm theo không?',
      },
      {
        startMs: 12500,
        en: 'Just a warm croissant, please. Is it possible to sit by the window?',
        vi: 'Cho mình thêm một bánh sừng bò ấm nhé. Mình ngồi ở bàn cạnh cửa sổ được không?',
      },
      {
        startMs: 18000,
        en: 'Of course, feel free to take any seat you like. I will bring your order right over.',
        vi: 'Tất nhiên rồi, bạn cứ thoải mái chọn chỗ ngồi nhé. Mình sẽ mang đồ ra ngay.',
      },
      {
        startMs: 24000,
        en: 'Thank you so much! Have a wonderful morning.',
        vi: 'Cảm ơn bạn rất nhiều! Chúc bạn một buổi sáng tốt lành.',
      },
    ],
  },
];

export async function seedVideos(prisma: PrismaClient): Promise<void> {
  const existingCount = await prisma.video.count();
  if (existingCount >= SAMPLE_VIDEOS.length) {
    console.log(`  ✓ Video đã có ${existingCount} bài — bỏ qua`);
    return;
  }

  let added = 0;
  for (const v of SAMPLE_VIDEOS) {
    const exists = await prisma.video.findFirst({
      where: { youtubeId: v.youtubeId },
      select: { id: true },
    });
    if (exists) continue;

    await prisma.video.create({
      data: {
        youtubeId: v.youtubeId,
        title: v.title,
        titleEn: v.titleEn,
        description: v.description,
        level: v.level,
        kind: v.kind,
        author: v.author,
        sortOrder: v.sortOrder,
        sentenceCount: v.lines.length,
        thumbnailUrl: `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`,
        isFree: true,
        lines: {
          create: v.lines.map((l, idx) => ({
            index: idx + 1,
            startMs: l.startMs,
            en: l.en,
            vi: l.vi,
          })),
        },
      },
    });
    added += 1;
  }
  console.log(`  ✓ ${added} video song ngữ mẫu`);
}
