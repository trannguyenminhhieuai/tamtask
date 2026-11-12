import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { title, type = "TASK", description = "" } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required", latencyMs: Date.now() - startTime },
        { status: 400 }
      );
    }

    const cleanTitle = title.trim();
    const lowerTitle = cleanTitle.toLowerCase();

    // Determine smart story points based on title length, keywords, and type
    let storyPoints = 3;
    if (lowerTitle.includes("tích hợp") || lowerTitle.includes("integrate") || lowerTitle.includes("sso") || lowerTitle.includes("oauth") || lowerTitle.includes("refactor")) {
      storyPoints = 5;
    } else if (lowerTitle.includes("kiến trúc") || lowerTitle.includes("microservice") || lowerTitle.includes("database migration") || lowerTitle.includes("tối ưu toàn diện")) {
      storyPoints = 8;
    } else if (lowerTitle.includes("sửa lỗi nhỏ") || lowerTitle.includes("fix typo") || lowerTitle.includes("cập nhật màu") || lowerTitle.includes("icon")) {
      storyPoints = 1;
    } else if (lowerTitle.includes("ui") || lowerTitle.includes("modal") || lowerTitle.includes("nút") || lowerTitle.includes("filter")) {
      storyPoints = 2;
    } else if (type === "BUG") {
      storyPoints = 2;
    }

    // Determine priority suggestion
    let suggestedPriority = "MEDIUM";
    if (lowerTitle.includes("lỗi 500") || lowerTitle.includes("crash") || lowerTitle.includes("bảo mật") || lowerTitle.includes("security") || lowerTitle.includes("data loss") || lowerTitle.includes("chặn") || lowerTitle.includes("block")) {
      suggestedPriority = "HIGHEST";
    } else if (type === "BUG" || lowerTitle.includes("bug") || lowerTitle.includes("không hoạt động") || lowerTitle.includes("fail")) {
      suggestedPriority = "HIGH";
    } else if (lowerTitle.includes("nâng cấp") || lowerTitle.includes("cải tiến") || lowerTitle.includes("tính năng")) {
      suggestedPriority = "MEDIUM";
    }

    // Generate BDD Given-When-Then format criteria tailored to title and type
    let criteriaContent = "";
    if (type === "BUG") {
      criteriaContent = `### 🐛 Tiêu chí Nghiệm thu & Tái hiện (BDD Acceptance Criteria):
- **Scenario: Tái hiện & Xác định lỗi**
  - **Given**: Người dùng thực hiện thao tác: "${cleanTitle}"
  - **When**: Gửi yêu cầu hoặc kích hoạt sự kiện trên giao diện
  - **Then**: Hệ thống không được phát sinh lỗi sập trang (500) hoặc ngoại lệ chưa bắt được

- **Scenario: Luồng khắc phục lỗi thành công**
  - **Given**: Bản vá mã nguồn (bugfix) đã được triển khai vào môi trường kiểm thử
  - **When**: Thực hiện lại chính xác kịch bản gây lỗi ban đầu
  - **Then**: Ứng dụng phản hồi kết quả hợp lệ, hiển thị thông báo thành công và ghi nhận vào log

- **Scenario: Kiểm thử hồi quy (Regression Test)**
  - **Given**: Các chức năng liên quan xung quanh khu vực sửa lỗi
  - **When**: Chạy bộ kiểm thử tự động (Unit Test / Integration Test)
  - **Then**: 100% các ca kiểm thử liên quan đều vượt qua (Passed) không phát sinh lỗi mới`;
    } else if (type === "STORY") {
      criteriaContent = `### 📖 Tiêu chí Nghiệm thu Người dùng (BDD Acceptance Criteria):
- **Scenario 1: Trải nghiệm người dùng cốt lõi (Happy Path)**
  - **Given**: Người dùng đã đăng nhập hợp lệ và có quyền thao tác trên dự án
  - **When**: Thực hiện chức năng: "${cleanTitle}"
  - **Then**: Giao diện hiển thị phản hồi tức thì (< 200ms), dữ liệu được lưu bền vững vào hệ thống

- **Scenario 2: Xử lý ngoại lệ & Kiểm tra tính hợp lệ dữ liệu (Edge Cases)**
  - **Given**: Người dùng nhập dữ liệu không hợp lệ, để trống trường bắt buộc hoặc thao tác khi mất mạng
  - **When**: Xác nhận thực hiện
  - **Then**: Hệ thống hiển thị cảnh báo hướng dẫn cụ thể bằng tiếng Việt, không làm mất dữ liệu đã nhập

- **Scenario 3: Tương thích trên đa thiết bị & Quyền hạn (RBAC)**
  - **Given**: Người dùng truy cập bằng tài khoản Viewer hoặc màn hình di động
  - **When**: Quan sát và tương tác với chức năng
  - **Then**: Bố cục co giãn mượt mà (Responsive) và các nút thao tác bị vô hiệu hóa đúng theo phân quyền`;
    } else {
      criteriaContent = `### ☑️ Tiêu chí Nghiệm thu Kỹ thuật (BDD Acceptance Criteria):
- **Scenario 1: Thực thi chức năng chính**
  - **Given**: Hệ thống đang ở trạng thái hoạt động bình thường
  - **When**: Kỹ sư/Người dùng thực hiện: "${cleanTitle}"
  - **Then**: Thao tác hoàn thành chính xác theo đặc tả kỹ thuật, không có lỗi console

- **Scenario 2: Đảm bảo hiệu năng & Lưu trữ**
  - **Given**: Cơ sở dữ liệu và API xử lý yêu cầu
  - **When**: Gọi API tương ứng với chức năng
  - **Then**: Thời gian phản hồi đạt chuẩn < 150ms, trạng thái được cập nhật thời gian thực

- **Scenario 3: Audit Trail & Nhật ký kiểm toán**
  - **Given**: Thao tác thay đổi trạng thái hoặc dữ liệu quan trọng hoàn tất
  - **When**: Kiểm tra lịch sử hoạt động (Activity Log)
  - **Then**: Hệ thống ghi nhận đầy đủ người thực hiện (Actor), thời điểm và nội dung thay đổi`;
    }

    return NextResponse.json({
      acceptanceCriteria: criteriaContent,
      suggestedStoryPoints: storyPoints,
      suggestedPriority,
      latencyMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error("Mouse-1 generate criteria error:", error);
    return NextResponse.json(
      { error: error.message, latencyMs: Date.now() - startTime },
      { status: 500 }
    );
  }
}
