# Tammi OA (Office Automation) — UI/UX Design System Specification

> **Tài liệu Quy Chuẩn Thiết Kế Giao Diện Tammi OA (Design System Standards)**  
> **Nguồn trích xuất**: Figma `[WEB] Tammi OA (Copy)` (`t=5QmfDJjMIuC9r66g-0`, Node: `155-16880`)  
> **Mục tiêu**: Chuẩn hóa toàn bộ hệ thống giao diện TamTask Space đạt chuẩn thiết kế Tammi OA, kết hợp bản sắc thương hiệu Viettel Red `#EE0033`, tính linh hoạt, hiện đại và chuẩn mực công thái học (Ergonomics).

---

## 1. Triết Lý Thiết Kế & Bản Sắc Thương Hiệu (Design Philosophy)

1. **Clean & High Contrast**: Nền trắng sáng (`#FFFFFF`) kết hợp bề mặt phẳng tương phản nhẹ (`#F8F8F8`) và viền ngăn cách tinh tế (`#D7D7D7`), tạo cảm giác thoáng đãng, chuyên nghiệp và giảm mỏi mắt khi làm việc cường độ cao.
2. **Semantic Token-Driven**: Toàn bộ màu sắc, kích thước lề, bo góc và hiệu ứng chuyển động đều được định nghĩa qua Design Tokens thay vì mã hóa cứng (hard-coded).
3. **Ergonomic Hierarchy**: Thông tin quan trọng nhất (Tiêu đề task, Trạng thái, Người nhận, Độ ưu tiên) được nhấn mạnh bằng phân cấp thị giác rõ ràng, hạn chế các yếu tố thừa gây nhiễu giao diện (đã lược bỏ các nhãn pill không cần thiết như "Trực quan", "Gantt" theo phản hồi người dùng).
4. **Hòa nhập Bản sắc Viettel & Tammi**:
   - **Viettel Red (`#EE0033`)**: Màu nhận diện thương hiệu độc quyền cho Logo `TT`, Huy hiệu dự án, Nút hành động chính (Primary CTA), Nhãn cảnh báo/Khẩn cấp (`HIGHEST`), Chỉ báo active tab.
   - **Tammi Emerald (`#079455`)**: Trạng thái hoàn thành (`DONE`), xác thực thành công, chỉ số hiệu suất tích cực.

---

## 2. Hệ Thống Design Tokens Chuẩn Hóa

### 2.1. Bảng Màu Semantic (Color Tokens)

| Token Name | Hex Code | Ứng Dụng Trong Giao Diện TamTask |
| :--- | :---: | :--- |
| **`color-brand-primary`** | `#EE0033` | Viettel Red: Logo, Primary Action Buttons, Active Tab Indicator, Focus Highlight |
| **`color-brand-hover`** | `#D6002E` | Trạng thái hover của nút bấm thương hiệu |
| **`color-brand-active`** | `#BD0029` | Trạng thái bấm giữ (active click) |
| **`color-brand-light`** | `#FEECEF` | Nền nhạt cho badge active, highlight dòng được chọn |
| **`color-success`** | `#079455` | Tammi Emerald: Nút xác nhận hoàn thành, Cột DONE, Tiến độ 100% |
| **`color-success-light`**| `#ECFDF3` | Nền tag thành công, tag trạng thái DONE |
| **`color-warning`** | `#D97706` | Hổ phách: Mức ưu tiên HIGH, Trạng thái QA/QC, Cảnh báo WIP limit |
| **`color-warning-light`**| `#FFFBEB` | Nền tag QA/QC hoặc nhãn cảnh báo |
| **`color-info`** | `#2563EB` | Xanh dương: Trạng thái IN PROGRESS, liên kết tài liệu |
| **`color-info-light`** | `#EFF6FF` | Nền tag IN PROGRESS |
| **`color-purple`** | `#7C3AED` | Tím: Trạng thái IN REVIEW, Epic Link tag |
| **`color-purple-light`** | `#F5F3FF` | Nền tag IN REVIEW, nhãn tính năng Epic |
| **`color-bg-canvas`** | `#FFFFFF` | Nền toàn bộ trang web, nền thẻ Task Kanban |
| **`color-bg-surface`** | `#F8F8F8` | Nền cột Kanban, nền Sidebar, nền header của Modal/Drawer, nền panel chi tiết |
| **`color-border`** | `#D7D7D7` | Viền input, đường chia bảng, viền thẻ card (1px solid) |
| **`color-border-subtle`**| `#EBEBEB` | Viền ngăn cách phụ, đường kẻ danh sách nhẹ |
| **`color-text-primary`** | `#111827` | Màu chữ chính, tiêu đề task, nhãn trường nhập liệu |
| **`color-text-secondary`**| `#4B5563`| Văn bản mô tả phụ, tiêu đề cột bảng, tóm tắt công việc |
| **`color-text-muted`** | `#9B9B9B` | Placeholder, thời gian tạo, mã định danh Jira ID |

---

### 2.2. Thang Đo Khoảng Cách (Spacing Grid - Base 8px)

Hệ thống lưới dựa trên cơ số **8px** (với bước đệm bán nguyên 4px cho không gian hẹp):
- **`space-2xs` (2px)**: Khoảng cách giữa các icon nhỏ, border offset.
- **`space-xs` (4px)**: Khoảng cách giữa icon và nhãn văn bản, khoảng cách trong pill badge.
- **`space-sm` (8px)**: Khoảng cách giữa các thẻ Task trong cùng một cột Kanban, khoảng cách giữa các trường form ngắn.
- **`space-md` (16px)**: Padding bên trong Card, khoảng cách giữa các phần trong Modal, khoảng cách nút bấm thanh công cụ.
- **`space-lg` (24px)**: Khoảng cách phân cách giữa các cột Kanban, padding toàn bộ khung nhìn Workspace.
- **`space-xl` (32px)**: Khoảng cách giữa các phân đoạn chức năng lớn (Sprints, Epics, Reports).

---

### 2.3. Quy Chuẩn Bo Góc (Border Radius)

- **`radius-sm` (4px)**: Tag nhỏ, Story point badge, Jira Issue Key badge (`HCC-12`).
- **`radius-md` (8px)**: **Chuẩn mực chính của Tammi OA**: Nút bấm (`button`), Ô input/select, Thẻ công việc (`IssueCard`), Menu dropdown item, Tab pill.
- **`radius-lg` (12px)**: Khung cột Kanban (`Kanban Column`), Vùng bao Sidebar, Hộp thoại (`Modal Window`), Ngăn kéo trượt góc trên (`Drawer container`).
- **`radius-full` (9999px)**: Ảnh đại diện nhân sự (Avatar), nút tròn đóng/mở.

---

### 2.4. Quy Chuẩn Đổ Bóng & Nổi Khối (Elevation & Shadows)

- **`shadow-xs`**: `0 1px 2px rgba(0, 0, 0, 0.04)` — Dùng cho Thẻ Task mặc định, Nút bấm phẳng.
- **`shadow-md`**: `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)` — Dùng cho Thẻ Task khi rê chuột (Hover) hoặc đang kéo thả (`isDragging`).
- **`shadow-xl`**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)` — Dùng cho Menu Dropdown, Ngăn kéo trượt `IssueDetailDrawer`.
- **`shadow-2xl`**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)` — Dùng cho Hộp thoại nổi Modal (`CreateIssueModal`, `ProjectMembersModal`).

---

### 2.5. Thang Bậc Xếp Tầng (Z-Index Hierarchy Standard)

Để khắc phục dứt điểm tình trạng Header bị đè lên Drawer và Modal (như phản ánh trong ảnh báo lỗi):
- `z-0`: Nội dung chính Workspace, Kanban Board, Backlog View, Timeline View, Dashboard.
- `z-10` - `z-20`: Header cột cuộn, thanh bar cố định bên trong views.
- `z-30`: Thanh điều hướng trên cùng (`Navbar Header`).
- `z-40` - `z-50`: Menu thả xuống cục bộ của Navbar (Project dropdown, Notification, Profile popover).
- `z-[70]`: Toàn bộ các ngăn kéo trượt (`Slide-over Drawers` như `IssueDetailDrawer`). Luôn phủ đè lên Header (`z-30`) và Workspace (`z-0`).
- `z-[80]`: Toàn bộ các hộp thoại / cửa sổ nổi (`Modals / Popups` như `CreateIssueModal`, `ProjectMembersModal`, `WorkflowSettingsModal`, etc.). Luôn nổi trên cùng, phủ đè lên cả Drawer và Header.
- `z-[9990]`: Thanh tìm kiếm nhanh toàn hệ thống (`CommandPalette`).
- `z-[9999]`: Thông báo hệ thống (`Toast notifications`).

---

## 3. Quy Chuẩn Thành Phần Giao Diện Cốt Lõi (Core Components)

### 3.1. Thanh Điều Hướng Trên Cùng (Navbar Header)
- **Chiều cao cố định**: `h-14` (56px), `sticky top-0 z-30`.
- **Nền & Viền**: Nền `#FFFFFF`, viền dưới `border-b border-[#D7D7D7]`.
- **Thành phần**:
  - Logo thương hiệu hình vuông đỏ bo góc 8px với chữ `TT` hoặc key dự án (`HCC`).
  - Dropdown chọn dự án: Tên dự án + Key pill + Chevron down, dropdown nổi `z-50` với bo góc `rounded-xl` (12px), viền `border-[#D7D7D7]`, đổ bóng `shadow-2xl`.
  - Ô tìm kiếm nhanh toàn hệ thống: `bg-[#F8F8F8]`, icon kính lúp, nhãn phím tắt `Ctrl + K`.
  - Nút Primary CTA: `+ Tạo Công Việc` — Nền `#EE0033`, chữ trắng, bo góc 8px, hover `#D6002E`.
  - Nhóm tiện ích bên phải: Nút quản trị viên, Chuông thông báo (kèm chấm đỏ chưa đọc), Avatar đại diện nhân sự.

---

### 3.2. Thanh Menu Bên Trái (Sidebar Navigation)
- **Chiều rộng**: `w-60` (240px) khi mở rộng, `w-14` (56px) khi thu gọn.
- **Nền & Viền**: Nền `#F8F8F8`, viền phải `border-r border-[#D7D7D7]`.
- **Khoảng cách mục**: Padding `px-3 py-2`, bo góc `rounded-lg` (8px).
- **Trạng thái Active**: Nền `#FFFFFF`, chữ `#EE0033`, có thanh chỉ báo dọc bên trái (`w-1 h-5 bg-[#EE0033] rounded-full`), font-bold, shadow-xs.
- **Trạng thái Inactive**: Chữ `#4B5563`, hover nền `#EFEFEF`, chữ `#111827`.
- **Giao diện tinh gọn**: Tuyệt đối không hiển thị các badge dư thừa ("Trực quan", "Gantt").

---

### 3.3. Bảng Công Việc Kanban (Kanban Board)
- **Thùng chứa cột (`Kanban Column`)**:
  - Nền `#F8F8F8`, viền bo góc `rounded-xl` (12px), border `border-[#D7D7D7]`.
  - Header cột: Tên cột in hoa kèm chấm tròn trạng thái, số lượng task và tổng điểm Story points.
  - Vùng kéo thả: Cuộn mượt mà `overflow-y-auto`, không tràn khung.
- **Thẻ công việc (`IssueCard`)**:
  - Nền trắng tinh khiết `#FFFFFF`, viền `border-[#D7D7D7]`, bo góc 8px `rounded-lg`.
  - Khi hover: Nâng nhẹ với `shadow-md` và viền sáng hơn kèm border hover `#EE0033]/40`.
  - Dòng 1: Epic tag (nếu có) với màu đặc trưng của Epic.
  - Dòng 2: Tiêu đề công việc sắc nét, font chữ `text-xs font-semibold text-[#111827]`.
  - Dòng 3: Tiến độ subtasks (thanh tiến trình mỏng tinh tế).
  - Dòng 4: Mã task `HCC-XX`, Story Points badge hình vuông, Avatar người thực hiện ở góc phải.

---

### 3.4. Ngăn Kéo Chi Tiết Công Việc (IssueDetailDrawer)
- **Vị trí & Lớp hiển thị**: Trượt từ mép phải màn hình, `fixed inset-0 z-[70] flex justify-end`.
- **Lớp nền mờ**: `bg-black/40 backdrop-blur-xs`, hỗ trợ click ngoài để đóng tức thì (`onClick={onClose}` kèm `e.stopPropagation()` ở panel con) và phím `Escape`.
- **Khung chứa**: Chiều rộng `w-full md:max-w-4xl`, nền `#FFFFFF`, bo góc trái `rounded-l-xl`.
- **Cấu trúc 2 cột**:
  - **Cột trái (65%)**: Mã task, tiêu đề chỉnh sửa nhanh tại chỗ, Mô tả Rich Text (`TiptapEditor`), Đính kèm tệp tin tài liệu, Nhiệm vụ con (Subtasks), Lịch sử liên kết công việc (Issue Links), Trao đổi thảo luận (Comments).
  - **Cột phải (35%)**: Panel thuộc tính trên nền `#F8F8F8` viền `border-l border-[#D7D7D7]`, bao gồm Người thực hiện (Assignee), Người báo cáo (Reporter), Trạng thái (Status), Mức ưu tiên (Priority), Chu kỳ (Sprint), Thuộc tính Epic, Ước lượng (Story Points), Thời gian làm việc (Worklog).

---

### 3.5. Hộp Thoại Nổi (Modals & Popups)
- **Lớp hiển thị**: `z-[80]`, luôn nằm trên cùng của toàn bộ màn hình kể cả Header và Drawer.
- **Lớp nền phủ**: `bg-black/50 backdrop-blur-xs`, click ngoài để đóng, bắt phím `Escape`.
- **Khung hộp thoại**: Nền trắng `#FFFFFF`, bo góc `rounded-xl` (12px), viền `border-[#D7D7D7]`, đổ bóng `shadow-2xl`.
- **Form controls**: Input & Select có padding `px-3 py-2`, nền `#FFFFFF` (hoặc `#F8F8F8`), viền `border-[#D7D7D7]`, bo góc `rounded-lg` (8px), khi focus hiển thị viền `#EE0033` kèm `ring-2 ring-[#EE0033]/20`.
- **Buttons**:
  - Primary CTA: Nền `#EE0033`, hover `#D6002E`, active `#BD0029`, chữ trắng, bo góc `rounded-lg` (8px).
  - Secondary/Hủy: Nền trong suốt hoặc `#F8F8F8`, viền `border-[#D7D7D7]`, bo góc `rounded-lg` (8px).

---

### 3.6. Màn Hình Đăng Nhập & Cổng Xác Thực (AuthLandingScreen)
- **Thiết kế tập trung**: Thẻ đăng nhập căn giữa, nền `#FFFFFF`, bo góc `rounded-xl` (12px), viền `border-[#D7D7D7]`, đổ bóng `shadow-md`.
- **Loại bỏ nhiễu**: Không hiển thị các bảng mô phỏng hoặc nhãn thừa bên cạnh, đảm bảo trải nghiệm gọn gàng, bảo mật chuẩn doanh nghiệp.
- **Nút hành động chính**: Viettel Red `#EE0033`, bo góc `rounded-lg` (8px).

---

## 4. Kế Hoạch Thực Thi & Kiểm Thử Trên Môi Trường Local

| Thứ Tự | Hạng Mục Nâng Cấp | Tệp Cần Điều Chỉnh | Chi Tiết Thực Thi |
| :---: | :--- | :--- | :--- |
| **1** | **Chuẩn hóa Token CSS & Bảng Màu** | `tailwind.config.ts`, `src/app/globals.css` | Cập nhật semantic tokens, màu `#EE0033`, `#079455`, `#F8F8F8`, `#D7D7D7` |
| **2** | **Nâng cấp Navbar theo chuẩn Tammi** | `src/components/jira/Navbar.tsx` | Đồng bộ bo góc 8px/12px, viền `#D7D7D7`, logo đỏ Viettel, bóng đổ `shadow-2xl` cho menu, z-index `z-30` |
| **3** | **Nâng cấp Sidebar theo chuẩn Tammi** | `src/components/jira/Sidebar.tsx` | Nền `#F8F8F8`, viền `#D7D7D7`, active indicator màu đỏ Viettel, bỏ badge thừa |
| **4** | **Nâng cấp Kanban Board & IssueCard** | `KanbanBoard.tsx`, `IssueCard.tsx` | Cột `rounded-xl` (12px), thẻ `#FFFFFF` viền `#D7D7D7` bo góc 8px, hover shadow mượt mà |
| **5** | **Nâng cấp IssueDetailDrawer** | `IssueDetailDrawer.tsx` | Panel phải `#F8F8F8`, viền `#D7D7D7`, bo góc 8px cho toàn bộ dropdowns, z-index `z-[70]` |
| **6** | **Nâng cấp Modals (Tạo công việc, Thành viên, v.v.)** | `CreateIssueModal.tsx`, `ProjectMembersModal.tsx` | Bo góc 12px, viền `#D7D7D7`, nút đỏ Viettel, z-index `z-[80]` |
| **7** | **Khởi chạy Local & Build Verification** | Next.js Server | `npm run build` thành công (exit 0) & duy trì `npm run dev` chạy nền liên tục |
