# Tammi OA (Office Automation) — UI/UX Design System Specification

> **Tài liệu Quy Chuẩn Thiết Kế Giao Diện Toàn Diện Tammi OA & App Design System**  
> **Nguồn trích xuất từ 2 thư viện Figma chuẩn:**  
> 1. Figma Master: `[APP] NEW - Design System (Copy)` (`fileKey: eBWYpAsYo7tqaUWLwFGOeW`, Node: `2017-579`)  
> 2. Figma Web Workspace: `[WEB] Tammi OA (Copy)` (`t=5QmfDJjMIuC9r66g-0`, Node: `155-16880`)  
> **Mục tiêu**: Chuẩn hóa toàn bộ hệ sinh thái giao diện TamTask Space đạt chuẩn Design System Tammi mới nhất, kết hợp bản sắc thương hiệu Viettel Red `#EE0033`, tính linh hoạt, hiện đại công nghệ cao và công thái học (Ergonomics).

---

## 1. Báo Cáo Đánh Giá Hiện Trạng DESIGN.md Đối Chiếu Với Figma App Design System

Qua quá trình đối chiếu trực tiếp giữa phiên bản `DESIGN.md` trước đó và thư viện Figma `[APP] NEW - Design System (Copy)` (Node `2017-579`):

| Hạng Mục | Hiện Trạng DESIGN.md Cũ | Quy Chuẩn Figma App Design System Mới | Đánh Giá & Giải Pháp Nâng Cấp |
| :--- | :--- | :--- | :--- |
| **Nguồn quy chuẩn** | Chỉ dẫn nguồn Figma Web (`155-16880`) | Cung cấp toàn bộ Foundations (`1:3`) và Base Components (`1:9`) | **Cần bổ sung**: Tích hợp cả hai nguồn làm tài liệu chuẩn mực cốt lõi. |
| **Quy chuẩn Nút Bấm (Buttons)** | Quy định `radius-md` (8px) | **Pill shape (`rounded-full` / `9999px`)**: Nút bấm hành động chính (Primary CTA), nút phụ (Secondary), nút hủy đều là hình viên thuốc (pill) với chiều cao `36px` - `48px`, font chữ `Google Sans Flex SemiBold 14px/16px` | **Đã cập nhật**: Đổi toàn bộ các nút bấm thao tác chính (Create Issue, Xác nhận, Hủy, Đăng nhập, Action Pill) sang `rounded-full`. |
| **Ô Nhập Liệu (Input Fields)** | Ô input hình chữ nhật bo góc 8px nền `#FFFFFF` | Nền nhạt `#FAFAFA`, viền mảnh `rgba(0,0,0,0.1)` (`#E5E5E5`), bo góc mềm **`rounded-xl` (12px) đến `rounded-2xl` (16px)**, chiều cao `48px` - `56px`, dấu sao bắt buộc màu đỏ Viettel `text-[#EE0033]` | **Đã cập nhật**: Chuyển đổi toàn bộ ô nhập liệu sang `rounded-xl`, nền `#FAFAFA`, chiều cao chuẩn và focus ring `#EE0033`. |
| **Nhãn & Thẻ (Tags & Badges)** | Thẻ trạng thái góc 4px (`rounded-sm`) | Thẻ Tag hình viên thuốc **`rounded-full` (`26.43px`)**, chiều cao chuẩn `20px` (xs) hoặc `24px` (sm), padding ngang `12px`, padding dọc `4px`, font Medium `12px`/`14px` với bảng màu chuẩn | **Đã cập nhật**: Đồng bộ tất cả Epic tags, status badges, issue key badges sang chuẩn pill viên thuốc. |
| **Hộp Thoại (Dialogs & Modals)** | Bo góc 12px (`rounded-xl`), nút đóng chữ nhật | Lớp phủ làm tối **`rgba(27,27,27,0.6)`**, khung hộp thoại bo góc lớn **`rounded-2xl` đến `rounded-3xl` (`24px` - `32px`)**, nút đóng hình tròn `rounded-full`, nhóm nút chân trang kép dạng pill | **Đã cập nhật**: Nâng cấp toàn bộ Modal (`CreateIssueModal`, `ProjectMembersModal`, `WorkflowSettingsModal`) lên bo góc `rounded-2xl/rounded-3xl`, nút đóng tròn và nút bấm pill. |
| **Phông Chữ (Typography)** | Không khai báo rõ Font family | Khai báo chính thức **`Google Sans Flex`** (tiêu đề SemiBold 600, nội dung Regular 400 / Medium 500) và fallback `Inter` | **Đã cập nhật**: Bổ sung khai báo font stack chuẩn trong `tailwind.config.ts` và `globals.css`. |

---

## 2. Hệ Thống Design Tokens Chuẩn Hóa Theo Figma App Design System

### 2.1. Bảng Màu Semantic (Color Tokens)

| Token Figma Name | Mã Hex / RGBA | Ứng Dụng Trong Giao Diện TamTask Space |
| :--- | :---: | :--- |
| **`comp/button/brand/btn-primary`** | `#EE0033` | Viettel Red: Primary Action Button, Logo TT, Highlight Active, Dấu `*` bắt buộc |
| **`color-brand-hover`** | `#D6002E` | Trạng thái hover của nút bấm thương hiệu Viettel |
| **`color-brand-active`** | `#BD0029` | Trạng thái nhấn giữ (Active click) |
| **`comp/button/solid/btn-solid`** | `#181818` | Dark Solid Button: Nút tối tương phản cao |
| **`comp/button/solid/btn-solid-secondary`** | `#FFFFFF` | Nền nút thứ cấp viền mảnh |
| **`comp/button/solid/btn-bd-solid-secondary`**| `#D7D7D7` / `#181818` | Viền nút thứ cấp |
| **`comp/tags/bg/success`** | `#079455` | Tammi Emerald: Tag trạng thái DONE, hoàn thành xuất sắc |
| **`comp/tags/bg/error`** | `#D92D20` | Đỏ cảnh báo: Tag lỗi, Bug, Blocked, Ưu tiên HIGHEST |
| **`comp/tags/bg/warning`** | `#F79009` | Cam hổ phách: Tag QA/QC, Đang kiểm thử, Ưu tiên HIGH |
| **`comp/tags/bg/info`** | `#175CD3` | Xanh dương: Tag IN PROGRESS, Đang thực hiện |
| **`comp/tags/bg/purple`** | `#7F56D9` | Tím phong cách: Tag IN REVIEW, Nhãn Epic |
| **`comp/input-field/input-bg-default`** | `#FAFAFA` | Nền ô nhập liệu input, textarea, select |
| **`comp/input-field/input-bd-default`** | `rgba(0,0,0,0.1)` (`#E5E5E5`) | Viền ô nhập liệu ở trạng thái mặc định |
| **`comp/overlay/bg-overlay`** | `rgba(27,27,27,0.6)` | Lớp phủ làm mờ tối nền Modal và Drawer |
| **`background/neutrals/bg-primary`** | `#FFFFFF` | Nền bề mặt chính, nền thẻ công việc Kanban, nền modal |
| **`background/neutrals/bg-secondary`** | `#F8F8F8` | Nền cột Kanban, nền Sidebar, nền header modal |
| **`text/neutrals/text-primary`** | `#181D27` / `#111827` | Màu chữ chính, tiêu đề task, nhãn heading |
| **`text/neutrals/text-secondary`** | `#494949` / `#4B5563` | Màu chữ mô tả phụ, tiêu đề phụ |
| **`text/neutrals/text-quaternary`**| `#797979` / `#9B9B9B` | Màu chữ placeholder, mã định danh Jira key |

---

### 2.2. Thang Đo Khoảng Cách (Spacing Grid - Base 8px)

Hệ thống lưới dựa trên cơ số **8px** (với bước bán nguyên 4px cho không gian hẹp):
- **`space-none`**: `0px`
- **`space-xxs`**: `2px`
- **`space-xs`**: `4px`
- **`space-md`**: `8px`
- **`space-lg`**: `12px`
- **`space-xl`**: `16px`
- **`space-2xl`**: `24px`
- **`space-3xl`**: `32px`

---

### 2.3. Quy Chuẩn Bo Góc (Border Radius Matrix)

| Token Radius | Kích Thước | Ứng Dụng Chuẩn Mực Trong Giao Diện |
| :--- | :---: | :--- |
| **`radius-full`** | **`9999px` / `26.43px`** | **Dấu ấn thiết kế cốt lõi của App DS**: Tất cả Nút bấm chính & phụ (Buttons), Thẻ nhãn (Tags & Badges), Avatar nhân sự, Nút đóng hình tròn (Circle Close Button), Status Dots. |
| **`radius-3xl`** | **`24px` - `32px`** | Khung hộp thoại nổi Modal (`CreateIssueModal`, `ProjectMembersModal`, `WorkflowSettingsModal`). |
| **`radius-2xl`** | **`16px`** | Cột Kanban (`Kanban Column`), Khung ô nhập liệu cỡ lớn. |
| **`radius-xl`** | **`12px`** | Ô nhập liệu Form (Input, Select, Textarea), Menu Dropdown nổi, Thẻ công việc (`IssueCard`). |
| **`radius-lg`** | **`8px`** | Nút bấm nhỏ nội bộ, nhãn phím tắt kbd, logo khối. |

---

### 2.4. Quy Chuẩn Đổ Bóng & Nổi Khối (Elevation & Shadows)

- **`shadow-xs`**: `0 1px 2px rgba(0, 0, 0, 0.04)` — Dùng cho Thẻ Task mặc định, Nút bấm phẳng.
- **`shadow-md`**: `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)` — Dùng cho Thẻ Task khi rê chuột (Hover) hoặc đang kéo thả (`isDragging`).
- **`shadow-xl`**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)` — Dùng cho Menu Dropdown, Ngăn kéo trượt `IssueDetailDrawer`.
- **`shadow-2xl`**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)` — Dùng cho Hộp thoại nổi Modal.

---

### 2.5. Thang Bậc Xếp Tầng (Z-Index Hierarchy Standard)

- `z-0`: Nội dung chính Workspace, Kanban Board, Backlog View, Timeline View, Dashboard.
- `z-10` - `z-20`: Header cột cuộn, thanh bar cố định bên trong views.
- `z-30`: Thanh điều hướng trên cùng (`Navbar Header`).
- `z-40` - `z-50`: Menu thả xuống cục bộ của Navbar (Project dropdown, Notification, Profile popover).
- `z-[70]`: Toàn bộ các ngăn kéo trượt (`Slide-over Drawers` như `IssueDetailDrawer`). Luôn phủ đè lên Header (`z-30`) và Workspace (`z-0`).
- `z-[80]`: Toàn bộ các hộp thoại / cửa sổ nổi (`Modals / Popups` như `CreateIssueModal`, `ProjectMembersModal`, `WorkflowSettingsModal`). Luôn nổi trên cùng, phủ đè lên cả Drawer và Header.
- `z-[9990]`: Thanh tìm kiếm nhanh toàn hệ thống (`CommandPalette`).
- `z-[9999]`: Thông báo hệ thống (`Toast notifications`).

---

## 3. Quy Chuẩn Thành Phần Giao Diện Cốt Lõi (Core Components)

### 3.1. Nút Bấm Chuẩn Mực (Buttons System)
- **Hình dạng**: Viên thuốc hoàn chỉnh (`rounded-full` / `radius-full`).
- **Biến thể Primary CTA**:
  - Nền `#EE0033` (Viettel Red), chữ trắng, font `font-semibold text-xs sm:text-sm`.
  - Hiệu ứng hover: `hover:bg-[#D6002E]`, click: `active:bg-[#BD0029]`, bóng mờ `shadow-sm`.
  - Padding: `px-4 sm:px-5 py-2` cho kích thước chuẩn.
- **Biến thể Secondary Action**:
  - Nền trắng `#FFFFFF`, viền `border-[#D7D7D7]`, chữ `#111827` / `#344054`, hover `#F8F8F8`.
  - Bo góc viên thuốc `rounded-full`, padding `px-4 sm:px-5 py-2`.
- **Biến thể Circle Icon Button**:
  - Nút tròn `w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition`.

### 3.2. Ô Nhập Liệu Form (Form Inputs & Selects)
- **Hình dạng**: Bo góc `rounded-xl` (12px) hoặc `rounded-2xl` (16px).
- **Màu sắc**: Nền `#FAFAFA`, viền `border-[#D7D7D7]`, chữ `#111827`, placeholder `#797979`.
- **Hiệu ứng Focus**: Viền đổi sang `#EE0033` kèm quầng sáng `focus:ring-2 focus:ring-[#EE0033]/20`.
- **Dấu trường bắt buộc**: Dấu sao đỏ Viettel `text-[#EE0033] font-semibold ml-0.5`.

### 3.3. Nhãn Trạng Thái & Thẻ Phân Loại (Tags & Badges)
- **Hình dạng**: Viên thuốc `rounded-full` với viền mềm hoặc nền solid.
- **Kích thước**: Chiều cao `20px` (xs) hoặc `24px` (sm), padding ngang `px-2.5` đến `px-3`.
- **Màu sắc theo tính chất**:
  - Hoàn thành (DONE): Nền `#ECFDF3`, chữ `#079455`, viền `#A6F4C5`.
  - Đang làm (IN PROGRESS): Nền `#EFF8FF`, chữ `#175CD3`, viền `#B2DDFF`.
  - Đang duyệt (IN REVIEW): Nền `#F4EBFF`, chữ `#7F56D9`, viền `#D6BBFB`.
  - Cảnh báo / QA: Nền `#FEF0C7`, chữ `#B54708`, viền `#FEDF89`.
  - Lỗi / Khẩn cấp: Nền `#FEE4E2`, chữ `#D92D20`, viền `#FECDCA`.

### 3.4. Cửa Sổ Hộp Thoại (Dialogs & Modals)
- **Lớp phủ nền**: `fixed inset-0 z-[80] bg-[rgba(27,27,27,0.6)] backdrop-blur-xs flex items-center justify-center`.
- **Khung hộp thoại**: Nền trắng `#FFFFFF`, bo góc mềm lớn `rounded-2xl sm:rounded-3xl` (`24px` - `32px`), viền `border-[#D7D7D7]`, bóng đổ `shadow-2xl`.
- **Header**: Nút đóng hình tròn `rounded-full` ở góc trên bên phải, hỗ trợ click ngoài và phím `Escape`.
- **Chân trang (Action Footer)**: Cặp nút viên thuốc kép gồm nút `Hủy` (Secondary pill) và nút `Xác nhận / Tiếp tục` (Primary Viettel Red pill).

### 3.5. Bảng Công Việc Kanban & Thẻ Công Việc
- **Thùng chứa cột (`Kanban Column`)**: Bo góc `rounded-2xl` (16px), nền `#F8F8F8`, viền `border-[#D7D7D7]`.
- **Thẻ công việc (`IssueCard`)**: Bo góc `rounded-xl` (12px), nền trắng `#FFFFFF`, viền `border-[#D7D7D7]`, đổ bóng mượt mà `shadow-xs hover:shadow-md hover:border-[#EE0033]/40`.
