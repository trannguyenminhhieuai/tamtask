import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== BẮT ĐẦU IMPORT DỰ ÁN HÀNH CHÍNH CÔNG LÊN PRODUCTION SUPABASE ===");

  // 1. Đảm bảo người dùng phụ trách tồn tại trong hệ thống
  const defaultPassword = await bcrypt.hash("TamTask@2026!", 10);
  const usersToEnsure = [
    { name: "Trần Minh Hiếu", email: "hieu.tran@company.com", role: "ADMIN", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" },
    { name: "Nguyễn Văn An", email: "an.nguyen@company.com", role: "DEVELOPER", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80" },
    { name: "Lê Hoàng Nam", email: "nam.le@company.com", role: "DEVELOPER", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80" },
    { name: "Phạm Thị Mai", email: "mai.pham@company.com", role: "QA", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" },
    { name: "Nguyễn Thu Hà", email: "ha.nguyen@company.com", role: "PROJECT_LEAD", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80" },
  ];

  const userMap: Record<string, string> = {};

  for (const u of usersToEnsure) {
    let existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      existing = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar,
          password: defaultPassword,
          status: "ACTIVE",
          isTwoFactorEnabled: true,
        },
      });
      console.log(`+ Đã tạo nhân sự: ${u.name} (${u.email})`);
    } else {
      userMap[u.name] = existing.id;
    }
    userMap[u.name] = existing.id;
  }

  const defaultLeadId = userMap["Trần Minh Hiếu"] || Object.values(userMap)[0];

  // 2. Tạo hoặc Cập nhật Project: "Hành Chính Công" (Key: "HCC")
  let project = await prisma.project.findFirst({
    where: {
      OR: [{ name: "Hành Chính Công" }, { key: "HCC" }],
    },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "Hành Chính Công",
        key: "HCC",
        description: "Dự án Tiện ích Hành Chính Công Tammi OA & Danh mục Yêu cầu Thay đổi (CR)",
        leadId: defaultLeadId,
      },
    });
    console.log(`+ Đã tạo dự án mới: [${project.key}] ${project.name} (ID: ${project.id})`);
  } else {
    console.log(`* Dự án đã tồn tại: [${project.key}] ${project.name} (ID: ${project.id})`);
  }

  // 3. Gán thành viên dự án
  for (const u of usersToEnsure) {
    const uId = userMap[u.name];
    if (uId) {
      const existingMember = await prisma.projectMember.findFirst({
        where: { projectId: project.id, userId: uId },
      });
      if (!existingMember) {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: uId,
            role: u.role === "ADMIN" ? "PROJECT_LEAD" : u.role,
          },
        });
        console.log(`  -> Gán thành viên ${u.name} vào dự án HCC`);
      }
    }
  }

  // 4. Tạo các Sprints cho dự án HCC
  const sprintDefs = [
    { name: "Sprint 01 (01/09 - 15/09)", status: "COMPLETED", startDate: "2026-09-01", endDate: "2026-09-15", goal: "Triển khai nền tảng Đặt lịch hẹn và Phản ánh kiến nghị" },
    { name: "Sprint 02 (16/09 - 30/09)", status: "COMPLETED", startDate: "2026-09-16", endDate: "2026-09-30", goal: "Đánh giá hài lòng, Tin tức thông báo, Liên kết dịch vụ công & Danh bạ khẩn cấp" },
    { name: "Sprint 05 (01/11 - 15/11)", status: "ACTIVE", startDate: "2026-11-01", endDate: "2026-11-15", goal: "Ấp/Khu phố thông minh, Bản tin phát thanh, Tích điểm & Xếp hạng công dân số" },
  ];

  const sprintMap: Record<string, string> = {};

  for (const sDef of sprintDefs) {
    let sprint = await prisma.sprint.findFirst({
      where: { projectId: project.id, name: sDef.name },
    });
    if (!sprint) {
      sprint = await prisma.sprint.create({
        data: {
          name: sDef.name,
          goal: sDef.goal,
          status: sDef.status,
          startDate: sDef.startDate,
          endDate: sDef.endDate,
          projectId: project.id,
        },
      });
      console.log(`+ Đã tạo Sprint: ${sDef.name}`);
    }
    sprintMap[sDef.name] = sprint.id;
  }

  // 5. Tạo Epics tương ứng các Module trong dự án HCC
  const epicModules: Record<string, string> = {
    "Đặt lịch hẹn": "#0052CC",
    "Phản ánh kiến nghị": "#EE0033",
    "Đánh giá hài lòng": "#FFAB00",
    "Tin tức, thông báo": "#36B37E",
    "Tin tức & bài viết": "#36B37E",
    "Liên kết dịch vụ công": "#6554C0",
    "Thông báo nhắc lịch": "#00B8D9",
    "Liên hệ khẩn cấp": "#FF5630",
    "Trợ lý ảo AI": "#8777D9",
    "Ấp/Khu phố thông minh": "#00875A",
    "Công dân số": "#FF7452",
    "CMS Admin HCC": "#403294",
    "Tích hợp hệ thống": "#0747A6",
    "Dashboard CMS Admin": "#172B4D",
    "Cấu hình trang chủ": "#DE350B",
  };

  const epicMap: Record<string, string> = {};

  for (const [moduleName, color] of Object.entries(epicModules)) {
    let epic = await prisma.epic.findFirst({
      where: { projectId: project.id, name: moduleName },
    });
    if (!epic) {
      epic = await prisma.epic.create({
        data: {
          name: moduleName,
          color,
          projectId: project.id,
        },
      });
      console.log(`+ Đã tạo Epic: ${moduleName} (${color})`);
    }
    epicMap[moduleName] = epic.id;
  }

  // 6. Dữ liệu từ tableconvert (2).md (21 tasks - Backlog phát triển tiện ích Hành Chính Công)
  const backlogFeatures = [
    {
      stt: 1,
      module: "Đặt lịch hẹn",
      title: "Đặt lịch giao dịch một cửa trực tuyến",
      type: "STORY",
      description: "Hỗ trợ người dân chọn cơ quan, lĩnh vực thủ tục và khung giờ tiếp nhận trước khi đến bộ phận Một cửa nhằm giảm thời gian chờ.",
      priority: "HIGH",
      sprint: "Sprint 01 (01/09 - 15/09)",
      status: "DONE",
      storyPoints: 5,
    },
    {
      stt: 2,
      module: "Phản ánh kiến nghị",
      title: "Phản ánh kiến nghị tình hình trên địa bàn phường/xã",
      type: "STORY",
      description: "Cho phép người dân gửi phản ánh, kiến nghị về các vấn đề phát sinh trên địa bàn phường/xã, kèm nội dung và hình ảnh minh chứng, vị trí GPS phản ánh. Hỗ trợ cán bộ tiếp nhận, xử lý, cập nhật trạng thái và phản hồi kết quả giải quyết cho người dân.",
      priority: "HIGH",
      sprint: "Sprint 01 (01/09 - 15/09)",
      status: "DONE",
      storyPoints: 8,
    },
    {
      stt: 3,
      module: "Đánh giá hài lòng",
      title: "Khảo sát mức độ hài lòng dịch vụ công",
      type: "STORY",
      description: "Bảng câu hỏi chấm điểm 5 sao và đánh giá chất lượng phục vụ của cán bộ một cửa.",
      priority: "MEDIUM",
      sprint: "Sprint 02 (16/09 - 30/09)",
      status: "DONE",
      storyPoints: 3,
    },
    {
      stt: 4,
      module: "Tin tức, thông báo",
      title: "Đăng tải tin tức, thông báo của phường/xã",
      type: "STORY",
      description: "Cho phép UBND Phường/Xã đăng tải tin tức, thông báo, lịch công tác và các nội dung phổ biến đến người dân trên Mini App.",
      priority: "MEDIUM",
      sprint: "Sprint 02 (16/09 - 30/09)",
      status: "DONE",
      storyPoints: 3,
    },
    {
      stt: 5,
      module: "Liên kết dịch vụ công",
      title: "Liên kết đến các tiện ích, cổng dịch vụ công",
      type: "STORY",
      description: "Tích hợp đường dẫn trực tiếp (deeplink) đến các cổng thông tin, tiện ích dịch vụ công của Chính phủ và cơ quan nhà nước, giúp người dân truy cập nhanh và thực hiện các thủ tục trực tuyến.",
      priority: "HIGH",
      sprint: "Sprint 02 (16/09 - 30/09)",
      status: "DONE",
      storyPoints: 5,
    },
    {
      stt: 6,
      module: "Thông báo nhắc lịch",
      title: "Thông báo tiếp nhận, xác nhận lịch hẹn, phản ánh kiến nghị",
      type: "STORY",
      description: "Tự động gửi thông báo đến người dân và cán bộ khi phát sinh lịch hẹn hoặc phản ánh kiến nghị, bao gồm thông báo tiếp nhận, xác nhận hoặc từ chối kèm lý do (nếu có). Đồng thời gửi thông báo nhắc lịch hẹn trước thời gian đăng ký.",
      priority: "HIGH",
      sprint: "Sprint 02 (16/09 - 30/09)",
      status: "DONE",
      storyPoints: 5,
    },
    {
      stt: 7,
      module: "Liên hệ khẩn cấp",
      title: "Danh bạ liên hệ khẩn cấp của phường/xã",
      type: "STORY",
      description: "Cung cấp danh sách số điện thoại liên hệ của UBND, công an, trạm y tế, bộ phận tiếp nhận phản ánh và các đầu mối hỗ trợ tại địa phương; hỗ trợ bấm gọi trực tiếp từ Mini App.",
      priority: "MEDIUM",
      sprint: "Sprint 02 (16/09 - 30/09)",
      status: "DONE",
      storyPoints: 2,
    },
    {
      stt: 8,
      module: "Trợ lý ảo AI",
      title: "Chatbot hỏi đáp thủ tục hành chính 24/7",
      type: "STORY",
      description: "Tích hợp mô hình AI giải đáp thắc mắc về thành phần hồ sơ, quy trình cấp phép và biểu mẫu hành chính thông dụng.",
      priority: "HIGH",
      sprint: null,
      status: "TODO",
      storyPoints: 8,
    },
    {
      stt: 9,
      module: "Ấp/Khu phố thông minh",
      title: "Trợ giúp khẩn cấp 113, 114, 115",
      type: "STORY",
      description: "Cung cấp các đầu mối hỗ trợ khẩn cấp như cấp cứu 115, công an 113, cứu hỏa 114 và các số liên hệ tại địa phương; cho phép người dân bấm gọi trực tiếp từ thiết bị.",
      priority: "HIGH",
      sprint: "Sprint 05 (01/11 - 15/11)",
      status: "TODO",
      storyPoints: 3,
    },
    {
      stt: 10,
      module: "Ấp/Khu phố thông minh",
      title: "Hàng xóm giúp nhau (Trao tặng nhu yếu phẩm)",
      type: "STORY",
      description: "Cho phép người dân đăng tải, chia sẻ và trao tặng miễn phí các nhu yếu phẩm, thực phẩm, cơm, gạo, quần áo và đồ dùng thiết yếu, góp phần kết nối cộng đồng và hỗ trợ người có hoàn cảnh khó khăn.",
      priority: "MEDIUM",
      sprint: null,
      status: "TODO",
      storyPoints: 5,
    },
    {
      stt: 11,
      module: "Ấp/Khu phố thông minh",
      title: "Giới thiệu sản phẩm địa phương & OCOP",
      type: "STORY",
      description: "Giới thiệu đặc sản, sản phẩm OCOP, sản phẩm thủ công và các sản phẩm tiêu biểu của địa phương nhằm quảng bá thương hiệu, hỗ trợ hộ kinh doanh và thúc đẩy kinh tế cộng đồng.",
      priority: "MEDIUM",
      sprint: null,
      status: "TODO",
      storyPoints: 5,
    },
    {
      stt: 12,
      module: "Ấp/Khu phố thông minh",
      title: "Sự kiện cộng đồng & An sinh xã hội",
      type: "STORY",
      description: "Cập nhật và thông báo các hoạt động tại địa phương như khám sức khỏe, tiêm chủng, họp tổ dân phố, hoạt động văn hóa, thể thao và các chương trình an sinh xã hội.",
      priority: "MEDIUM",
      sprint: null,
      status: "TODO",
      storyPoints: 3,
    },
    {
      stt: 13,
      module: "Ấp/Khu phố thông minh",
      title: "Lấy ý kiến người dân & Khảo sát địa phương",
      type: "STORY",
      description: "Hỗ trợ chính quyền và ban quản lý khu phố tạo khảo sát, lấy ý kiến người dân về các vấn đề tại địa phương; cho phép người dân gửi phản hồi và theo dõi kết quả tổng hợp theo quyền được cấp.",
      priority: "MEDIUM",
      sprint: null,
      status: "TODO",
      storyPoints: 5,
    },
    {
      stt: 14,
      module: "Ấp/Khu phố thông minh",
      title: "Bản đồ số địa phương và các địa điểm thiết yếu",
      type: "STORY",
      description: "Hiển thị bản đồ số các địa điểm công cộng, cơ sở dịch vụ và tiện ích trong khu vực; hỗ trợ người dân tra cứu vị trí và định hướng đến địa điểm cần tìm. Danh sách gồm nhà văn hóa, trạm y tế, trường học, sinh hoạt cộng đồng.",
      priority: "HIGH",
      sprint: null,
      status: "TODO",
      storyPoints: 8,
    },
    {
      stt: 15,
      module: "Ấp/Khu phố thông minh",
      title: "Tra cứu camera an ninh địa bàn",
      type: "STORY",
      description: "Tích hợp danh sách hoặc bản đồ vị trí camera an ninh tại địa phương; hỗ trợ tra cứu và xem hình ảnh trực tiếp đối với các camera được cấp quyền, bảo đảm an toàn thông tin và quyền riêng tư.",
      priority: "MEDIUM",
      sprint: null,
      status: "TODO",
      storyPoints: 5,
    },
    {
      stt: 16,
      module: "Ấp/Khu phố thông minh",
      title: "Bản tin phát thanh địa phương (Audio Streaming)",
      type: "STORY",
      description: "Cho phép người dân nghe bản tin thời sự, thông báo của phường/xã và nội dung phát thanh cộng đồng dưới dạng âm thanh ngay trên Mini App.",
      priority: "HIGH",
      sprint: "Sprint 05 (01/11 - 15/11)",
      status: "TODO",
      storyPoints: 5,
    },
    {
      stt: 17,
      module: "Ấp/Khu phố thông minh",
      title: "Thông báo khẩn cấp thiên tai & an ninh",
      type: "STORY",
      description: "Phát thông báo khẩn cấp đến người dân về thiên tai, thời tiết nguy hiểm, dịch bệnh, sự cố an ninh và các tình huống cần ứng phó; hỗ trợ hiển thị nội dung cảnh báo nổi bật.",
      priority: "MEDIUM",
      sprint: null,
      status: "TODO",
      storyPoints: 3,
    },
    {
      stt: 18,
      module: "Ấp/Khu phố thông minh",
      title: "Dự báo thời tiết địa phương",
      type: "STORY",
      description: "Cung cấp thông tin thời tiết hiện tại và dự báo tại địa phương, hỗ trợ người dân chủ động theo dõi điều kiện thời tiết và các cảnh báo liên quan.",
      priority: "MEDIUM",
      sprint: null,
      status: "TODO",
      storyPoints: 2,
    },
    {
      stt: 19,
      module: "Công dân số",
      title: "Tích điểm hoạt động công dân",
      type: "STORY",
      description: "Xây dựng cơ chế tích điểm dựa trên các hoạt động của người dân trên Mini App: đăng ký tài khoản (+5 điểm), giới thiệu bạn bè (+5 điểm), gửi phản ánh kiến nghị (+5 điểm), đặt lịch hẹn (+5 điểm); hỗ trợ cấu hình quy tắc cộng điểm và kiểm soát gian lận.",
      priority: "MEDIUM",
      sprint: "Sprint 05 (01/11 - 15/11)",
      status: "TODO",
      storyPoints: 5,
    },
    {
      stt: 20,
      module: "Công dân số",
      title: "Xếp hạng công dân (Cấp bậc danh dự)",
      type: "STORY",
      description: "Phân loại và xếp hạng công dân theo tổng điểm tích lũy: Công dân số, Công dân tích cực, Công dân tiêu biểu, Công dân gương mẫu, Đại sứ cộng đồng.",
      priority: "MEDIUM",
      sprint: "Sprint 05 (01/11 - 15/11)",
      status: "TODO",
      storyPoints: 5,
    },
    {
      stt: 21,
      module: "Công dân số",
      title: "Khen thưởng và quyền lợi công dân số",
      type: "STORY",
      description: "Xây dựng cơ chế ghi nhận, khen thưởng người dân tích cực tham gia hoạt động số và cộng đồng; quyền lợi gồm giấy khen điện tử, quà tặng, ưu đãi hoặc tuyên dương từ phường/xã.",
      priority: "MEDIUM",
      sprint: "Sprint 05 (01/11 - 15/11)",
      status: "TODO",
      storyPoints: 5,
    },
  ];

  // 7. Dữ liệu từ tableconvert.md (10 Yêu cầu Thay đổi - Change Requests)
  const changeRequests = [
    {
      crCode: "CR-002",
      module: "CMS Admin HCC",
      title: "Bổ sung thêm luồng chặn đơn vị",
      type: "TASK",
      description: "Bổ sung cơ chế chặn quyền sử dụng tiện ích HCC đối với các đơn vị được xác định không đủ điều kiện hoặc không còn thuộc phạm vi triển khai. Khi đơn vị bị chặn, hệ thống kiểm tra và ngăn đơn vị tiếp tục sử dụng các chức năng HCC. Quản lý trạng thái chặn/mở chặn trên CMS Admin HCC.",
      priority: "HIGH",
      assigneeName: "Trần Minh Hiếu",
      dueDate: "2026-10-30",
      status: "DONE",
      storyPoints: 5,
    },
    {
      crCode: "CR-001",
      module: "Đặt lịch hẹn",
      title: "CMS HCC bổ sung thêm cấu hình cán bộ xử lý lịch hẹn",
      type: "TASK",
      description: "Bổ sung chức năng cho phép đơn vị cấu hình và phân công cán bộ phụ trách xử lý lịch hẹn trên CMS HCC. Thông tin cán bộ được cấu hình sẽ dùng để xác định người tiếp nhận, theo dõi và xử lý các lịch hẹn của người dân. Nếu không phân công thì chạy luồng mặc định.",
      priority: "HIGH",
      assigneeName: "Nguyễn Văn An",
      dueDate: "2026-11-15",
      status: "IN_PROGRESS",
      storyPoints: 5,
    },
    {
      crCode: "CR-002",
      module: "Phản ánh kiến nghị",
      title: "CMS HCC bổ sung thêm cấu hình cán bộ xử lý phản ánh",
      type: "TASK",
      description: "Bổ sung chức năng cho phép đơn vị cấu hình và phân công cán bộ phụ trách tiếp nhận, xử lý phản ánh kiến nghị của người dân trên CMS HCC. Cho phép cập nhật thông tin phân công khi có thay đổi về nhân sự hoặc nhiệm vụ.",
      priority: "HIGH",
      assigneeName: "Nguyễn Thu Hà",
      dueDate: "2026-11-15",
      status: "IN_PROGRESS",
      storyPoints: 5,
    },
    {
      crCode: "CR-003",
      module: "Đặt lịch hẹn",
      title: "Cho phép limit quota số lượng tiếp dân theo loại thủ tục",
      type: "TASK",
      description: "Bổ sung cấu hình giới hạn số lượng lịch hẹn hoặc lượt tiếp dân tối đa theo từng loại thủ tục trong khung thời gian tiếp nhận. Tự động kiểm tra số lượng so với quota đã cấu hình, khi đạt giới hạn không cho đăng ký thêm nhằm tránh quá tải.",
      priority: "MEDIUM",
      assigneeName: "Lê Hoàng Nam",
      dueDate: "2026-11-15",
      status: "TODO",
      storyPoints: 3,
    },
    {
      crCode: "CR-004",
      module: "Đặt lịch hẹn",
      title: "Bổ sung thêm luồng đóng lịch hẹn và gửi tin nhắn hoàn tất cho người dân",
      type: "TASK",
      description: "Bổ sung chức năng cho phép cán bộ chủ động đóng lịch hẹn sau khi hoàn tất tiếp nhận và xử lý yêu cầu của người dân. Hệ thống cập nhật trạng thái sang đã xử lý và tự động gửi thông báo đến người dân qua kênh thông báo tích hợp.",
      priority: "MEDIUM",
      assigneeName: "Phạm Thị Mai",
      dueDate: "2026-11-15",
      status: "TODO",
      storyPoints: 3,
    },
    {
      crCode: "CR-005",
      module: "Tin tức & bài viết",
      title: "Bổ sung chức năng đính kèm tệp tin trong bài viết (PDF, Word, Excel)",
      type: "TASK",
      description: "Bổ sung chức năng cho phép cán bộ đính kèm tệp tin vào nội dung tin tức và bài viết trên CMS HCC. Hỗ trợ các định dạng tệp PDF, Word và Excel. Cho phép tải lên, xem danh sách tệp đính kèm, cập nhật hoặc xóa tệp trước khi đăng bài; người dân có thể tải xuống tệp.",
      priority: "MEDIUM",
      assigneeName: "Nguyễn Văn An",
      dueDate: "2026-11-15",
      status: "TODO",
      storyPoints: 5,
    },
    {
      crCode: "CR-006",
      module: "Tích hợp hệ thống",
      title: "Tích hợp đồng bộ dữ liệu từ hệ thống HCC phường/xã",
      type: "TASK",
      description: "Xây dựng cơ chế tích hợp và đồng bộ dữ liệu giữa hệ thống HCC phường/xã và CMS HCC. Xác định các nhóm dữ liệu đồng bộ, chiều đồng bộ, tần suất và quy tắc ánh xạ dữ liệu. Đảm bảo dữ liệu chính xác, chống trùng lặp, có nhật ký log và xử lý lỗi đồng bộ lại.",
      priority: "MEDIUM",
      assigneeName: "Trần Minh Hiếu",
      dueDate: "2026-11-15",
      status: "TODO",
      storyPoints: 8,
    },
    {
      crCode: "CR-007",
      module: "Dashboard CMS Admin",
      title: "Điều chỉnh số liệu và bổ sung bộ lọc danh sách Tenant đang hoạt động",
      type: "TASK",
      description: "1. Điều chỉnh logic thống kê để hiển thị chính xác số lượng Tenant đang hoạt động trên Dashboard Admin. 2. Bổ sung chức năng lọc và xem danh sách các Tenant đang hoạt động. 3. Cho phép xuất danh sách tenants bao gồm: OA_ID, tên, trạng thái.",
      priority: "HIGH",
      assigneeName: "Lê Hoàng Nam",
      dueDate: "2026-11-15",
      status: "IN_PROGRESS",
      storyPoints: 5,
    },
    {
      crCode: "CR-008A",
      module: "Cấu hình trang chủ",
      title: "Cho phép thêm, chỉnh sửa section trên màn hình trang chủ",
      type: "TASK",
      description: "1. Cho phép thêm mới section và chỉnh sửa tên section trên màn hình trang chủ. 2. Cho phép thêm mới, chỉnh sửa và xóa các tính năng thuộc từng section. 3. Mặc định khởi tạo 02 section: Tiện ích công dân và Tiện ích cho doanh nghiệp.",
      priority: "HIGH",
      assigneeName: "Nguyễn Thu Hà",
      dueDate: "2026-11-15",
      status: "IN_PROGRESS",
      storyPoints: 5,
    },
    {
      crCode: "CR-008B",
      module: "Cấu hình trang chủ",
      title: "Cho phép cấu hình loại liên kết nội bộ (deeplink dẫn đến các tiện ích)",
      type: "TASK",
      description: "Tại mỗi section khi thêm tính năng, cho phép lựa chọn liên kết Chức năng công dân (nội bộ). Hỗ trợ nhập deeplink, tên hiển thị, icon đại diện. Sau khi lưu, khi người dùng nhấn tính năng sẽ điều hướng chuẩn xác thông qua deeplink.",
      priority: "HIGH",
      assigneeName: "Trần Minh Hiếu",
      dueDate: "2026-11-15",
      status: "IN_PROGRESS",
      storyPoints: 5,
    },
  ];

  // 8. Thực hiện chèn/cập nhật Tasks vào Database Supabase
  let importedCount = 0;

  // Insert 21 features
  for (const item of backlogFeatures) {
    const key = `HCC-${item.stt}`;
    const sprintId = item.sprint ? sprintMap[item.sprint] : undefined;
    const epicId = epicMap[item.module];

    await prisma.issue.upsert({
      where: { key },
      update: {
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        priority: item.priority,
        storyPoints: item.storyPoints,
        projectId: project.id,
        sprintId: sprintId || null,
        epicId: epicId || null,
        reporterId: defaultLeadId,
        labels: `Hành Chính Công, ${item.module}`,
      },
      create: {
        key,
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        priority: item.priority,
        storyPoints: item.storyPoints,
        projectId: project.id,
        sprintId: sprintId || null,
        epicId: epicId || null,
        reporterId: defaultLeadId,
        labels: `Hành Chính Công, ${item.module}`,
      },
    });
    importedCount++;
    console.log(`✓ Đã import [${key}]: ${item.title} -> ${item.status}`);
  }

  // Insert 10 Change Requests
  let crIndex = 22;
  for (const item of changeRequests) {
    const key = `HCC-${crIndex++}`;
    const epicId = epicMap[item.module];
    const assigneeId = item.assigneeName ? userMap[item.assigneeName] : undefined;

    await prisma.issue.upsert({
      where: { key },
      update: {
        title: `[${item.crCode}] ${item.title}`,
        description: item.description,
        type: item.type,
        status: item.status,
        priority: item.priority,
        storyPoints: item.storyPoints,
        dueDate: item.dueDate,
        projectId: project.id,
        epicId: epicId || null,
        assigneeId: assigneeId || null,
        reporterId: defaultLeadId,
        labels: `CR, ${item.crCode}, ${item.module}`,
      },
      create: {
        key,
        title: `[${item.crCode}] ${item.title}`,
        description: item.description,
        type: item.type,
        status: item.status,
        priority: item.priority,
        storyPoints: item.storyPoints,
        dueDate: item.dueDate,
        projectId: project.id,
        epicId: epicId || null,
        assigneeId: assigneeId || null,
        reporterId: defaultLeadId,
        labels: `CR, ${item.crCode}, ${item.module}`,
      },
    });
    importedCount++;
    console.log(`✓ Đã import [${key}]: [${item.crCode}] ${item.title} (Người phụ trách: ${item.assigneeName || "Chưa gán"}) -> ${item.status}`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 HOÀN THÀNH IMPORT DỰ ÁN "HÀNH CHÍNH CÔNG" (HCC)!`);
  console.log(`- Tổng số task đã nạp vào CSDL Supabase: ${importedCount} tasks.`);
  console.log(`- Dự án: [${project.key}] ${project.name} (ID: ${project.id})`);
  console.log(`- Trưởng dự án: Trần Minh Hiếu`);
  console.log(`- Số Sprints: ${Object.keys(sprintMap).length}`);
  console.log(`- Số Epics/Modules: ${Object.keys(epicMap).length}`);
  console.log(`======================================================\n`);
}

main()
  .catch((e) => {
    console.error("Lỗi khi import:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

