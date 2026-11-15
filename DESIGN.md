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

---

## 4. Quy Chuẩn Đảo Nổi Kính Mờ (Glassmorphic Island Architecture) & Nguyên Tắc MICI / MECE

### 4.1. Kiến Trúc Đảo Nổi Kính Mờ (Glassmorphic Floating Island Headers)
Để tạo cảm giác phân tầng thị giác cao cấp (High-Tech Spatial Elevation) tương tự macOS, iOS và Tammi OA, các thanh tiêu đề và bộ điều hướng của mọi phân hệ (`Kanban`, `Backlog`, `Timeline`, `Automations`, `Reports`, `Admin`) được thiết kế đồng bộ dưới dạng **Đảo Nổi Kính Mờ (Floating Glass Island)**:
- **Khung chứa Đảo Nổi**: `mx-3 sm:mx-6 mt-3 mb-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border border-white/60 dark:border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3`.
- **Đặc tính**: Nổi trên bề mặt canvas xám trung tính `#F5F6F8`, không bị chìm xuống background, tạo đường phân tách rõ rệt giữa điều khiển (Controls) và không gian làm việc (Canvas).

### 4.2. Nguyên Tắc Tổ Chức Thông Tin MICI / MECE (Mutually Exclusive, Collectively Exhaustive)
- **Tuyệt đối không trùng lặp thông tin**:
  - Tên chu kỳ và khoảng thời gian (`Sprint 1 • 01/11 - 14/11`) chỉ xuất hiện **duy nhất 1 lần** trên Badge chính tại Header Đảo nổi.
  - Bộ chọn Sprint trong filter bar chỉ hiển thị tên ngắn gọn (`Sprint 1`, `Sprint 2`), không lặp lại chuỗi ngày tháng hay trạng thái "Đang chạy" đã có ở Header.
  - Phân quyền người dùng chỉ xuất hiện trong Popover hồ sơ cá nhân, không hiển thị thêm badge trên Header chính.
  - Bộ điều hướng phân hệ nằm duy nhất tại Sidebar bên trái, không lặp lại Dock trùng lặp ở Navbar.
- **Tập trung hóa các bộ lọc thứ cấp (Secondary Filters Consolidation)**:
  - Các tùy chọn ít sử dụng liên tục (Phân làn Swimlanes, Lọc Epic, Cài đặt Quy trình, Quản lý Epic) được gom gọn gàng vào menu popover `Tuỳ chọn & Phân làn`, giúp thanh điều khiển chính luôn thoáng đãng.

### 4.3. Thanh Điều Hướng Bên Tự Động Thu Gọn (Auto-Collapsing Hover Sidebar)
- **Trạng thái Mặc định (Compact Dock)**: Chiều rộng `64px` (`w-16`), chỉ hiển thị các biểu tượng căn giữa tinh tế và avatar dự án, tối đa hóa diện tích ngang cho bảng công việc.
- **Trạng thái Tương tác (Hover Expansion)**: Khi rê chuột vào (`onMouseEnter`), thanh bên tự động bung mượt mà (`transition-all duration-300 ease-in-out`) ra `240px` (`w-60`), hiển thị đầy đủ nhãn phân hệ, thông tin dự án, và nút Ghim (`Pin`).
- **Nút Ghim (Pin / Unpin)**: Cho phép người dùng cố định thanh bên luôn mở nếu làm việc trên màn hình lớn.
- **Bao khung Bo Góc Tammi OA**: Thanh bên được bọc trong container bo góc mềm mại `rounded-2xl sm:rounded-3xl` kính mờ nổi tách biệt khỏi mép màn hình.

### 4.4. Tối Ưu Hóa Chiều Dài Không Gian Hiển Thị Task (Vertical Space Maximization)
- Bằng cách tích hợp Header và Bộ lọc thành một Đảo nổi duy nhất (chiều cao ~52px thay vì 140px cũ), không gian hiển thị cột Kanban được nới rộng thêm gần `90px`.
- Chiều cao danh sách thẻ trong cột nâng lên `max-h-[calc(100vh-180px)]`, giúp người dùng quan sát được nhiều thẻ công việc nhất mà không phải cuộn trang liên tục.

### 4.5. Chuẩn Hóa Màu Sắc Giao Diện Kép (Light & Dark System Tokens)
- **Light Mode**: Nền Canvas `#F5F6F8`, Nền Đảo Nổi/Navbar `bg-white/85 backdrop-blur-md`, Viền `border-[#E5E7EB]`, Chữ chính `#111827`, Chữ phụ `#4B5563`.
- **Dark Mode**: Nền Canvas `#09090B`, Nền Đảo Nổi/Navbar `dark:bg-zinc-900/85 dark:backdrop-blur-md`, Viền `dark:border-zinc-800`, Chữ chính `dark:text-zinc-100`, Chữ phụ `dark:text-zinc-400`.
- **Thương hiệu**: Giữ vẹn nguyên Viettel Red `#EE0033` cho các hành động trọng yếu, active indicators, và hover highlights ở cả hai chế độ.


---

## 5. Chuẩn Hóa Lần 2 — 8 Quy Tắc Bắt Buộc (v2.0 — 2026-11-15)

> Áp dụng cho toàn bộ hệ thống hiện tại và **mọi tính năng bổ sung sau này**. Không được phép có ngoại lệ.

### 5.1. Quy Tắc Spacing & Gap Thống Nhất 16px

**Đơn vị chuẩn**: `16px` (Tailwind: `p-4`, `gap-4`, `space-y-4`).

| Ngữ cảnh | Class Tailwind | Giá trị |
| :--- | :--- | :--- |
| Padding nội dung chính (card, panel, island) | `p-4` | 16px |
| Khoảng cách giữa các phần tử (flex/grid gap) | `gap-4` | 16px |
| Khoảng cách dọc giữa các card/item | `space-y-4` | 16px |
| Padding ngang nút bấm chính | `px-4` | 16px |

> [!WARNING]
> **Nghiêm cấm** sử dụng `p-2`, `p-3`, `gap-2`, `gap-3`, `space-y-2`, `space-y-3` cho containers chính. Chỉ dùng các giá trị nhỏ hơn trong trường hợp nested element cực kỳ hẹp (badge nội dung, kbd shortcut).

---

### 5.2. Phân Cấp Border Radius Dự Án (Radius Hierarchy)

| Cấp độ | Class Tailwind | px | Áp dụng cho |
| :--- | :--- | :---: | :--- |
| **Island / Modal / Drawer / Column** | `rounded-2xl` | 16px | Tất cả "đảo nổi" (island header), Kanban columns, Drawer container, Modal frame, right panel island |
| **Card / Input / Select / Textarea** | `rounded-xl` | 12px | `IssueCard`, form inputs, select boxes, dropdown menus |
| **Button / Badge / Search / Avatar** | `rounded-full` | 9999px | Mọi nút bấm (primary/secondary/icon), status badges, epic tags, search bar, avatar |

---

### 5.3. Glassmorphic Token Chuẩn (Glass Surface System)

#### Light Mode Glass
```css
/* Island Header / Navbar */
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.60);
box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.70), 0 4px 20px rgba(0, 0, 0, 0.03);

/* Tailwind class: bg-white/85 backdrop-blur-md border border-white/60 */
/* Global CSS: .glass-surface */
```

#### Dark Mode Glass
```css
/* Island Header / Navbar dark */
background: rgba(24, 24, 27, 0.85); /* zinc-900/85 */
backdrop-filter: blur(12px);
border: 1px solid rgba(63, 63, 70, 1); /* zinc-700 */
box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.3);

/* Tailwind: dark:bg-zinc-900/85 dark:border-zinc-700 */
```

#### Glass Pill (Search bar, Buttons)
```css
/* .glass-pill */
background: rgba(255, 255, 255, 0.70);
backdrop-filter: blur(8px);
box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.80), 0 1px 3px rgba(0,0,0,0.06);
border-radius: 9999px;
```

---

### 5.4. Dark Mode Token Map Toàn Hệ Thống

| Yếu tố | Light Token | Dark Token |
| :--- | :--- | :--- |
| Canvas (nền trang) | `bg-[#F5F6F8]` | `dark:bg-[#09090B]` |
| Island / Panel nổi | `bg-white/85` | `dark:bg-zinc-900/85` |
| Card (IssueCard, panel) | `bg-white` | `dark:bg-zinc-900` |
| Viền card/island | `border-[#E5E7EB]` | `dark:border-zinc-800` |
| Viền mờ / divider | `border-zinc-100` | `dark:border-zinc-800` |
| Chữ chính | `text-gray-900` / `text-[#111827]` | `dark:text-zinc-100` |
| Chữ phụ | `text-gray-500` / `text-[#4B5563]` | `dark:text-zinc-400` |
| Chữ placeholder | `text-gray-400` | `dark:text-zinc-500` |
| Input nền | `bg-[#FAFAFA]` | `dark:bg-zinc-800` |
| Input viền | `border-[#D7D7D7]` | `dark:border-zinc-700` |
| Hover bg nhẹ | `hover:bg-gray-50` | `dark:hover:bg-zinc-800` |
| Modal overlay | `bg-[rgba(27,27,27,0.6)]` | (unchanged — works on both) |
| **Accent (invariant)** | `#EE0033` | `#EE0033` (giữ nguyên cả 2 mode) |

> [!IMPORTANT]
> Mọi component mới **bắt buộc** có cả light + dark token. Không được thiếu `dark:` class.

---

### 5.5. Sidebar Auto-Collapse Behavior

- **Mặc định**: `w-16` (64px) — collapsed, chỉ icon.
- **Hover**: `w-60` (240px) — expand, hiện label đầy đủ, `transition-all duration-300 ease-in-out`.
- **Pin**: Nút ghim cố định `w-60` nếu user muốn, lưu vào `localStorage`.
- **Không hiển thị**: Sprint info, role badge, breadcrumb dự án dạng text dài.
- **Hiển thị**: Icon phân hệ + label (khi expand), Avatar dự án, Theme toggle, Pin button.

---

### 5.6. Modal & Drawer Tiêu Chuẩn

Mọi Modal và Drawer **bắt buộc** có:
1. ✅ Backdrop click để đóng: outer div `onClick={onClose}` + inner div `onClick={e => e.stopPropagation()}`.
2. ✅ Phím `Escape` để đóng: `useEffect` gắn `keydown` listener.
3. ✅ Nút đóng `×` hình tròn `rounded-full` góc trên phải.
4. ✅ Footer có nút `Hủy` (secondary pill) + nút hành động chính (primary red pill).

| Thành phần | Class chuẩn |
| :--- | :--- |
| Overlay | `fixed inset-0 z-[80] bg-[rgba(27,27,27,0.6)] backdrop-blur-xs flex items-center justify-center` |
| Modal frame | `bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-white/80 dark:border-zinc-800 w-full max-w-2xl` |
| Drawer container | `fixed inset-y-0 right-0 z-[70] w-full md:max-w-4xl bg-white dark:bg-zinc-900 shadow-2xl` |
| Right panel island | `bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-4 border border-white/80 dark:border-zinc-800 shadow-sm` |

---

### 5.7. Z-Index Hierarchy (Không Thay Đổi)

```
z-0          → Canvas (Kanban, Backlog, Timeline, Dashboard)
z-10 – z-20  → Sticky column headers, inner fixed bars
z-30         → Navbar (top header)
z-40 – z-50  → Navbar local dropdowns (project picker, notifications, profile)
z-[70]       → Slide-over Drawers (IssueDetailDrawer)
z-[80]       → Modals / Dialogs (CreateIssueModal, ProjectMembersModal, etc.)
z-[9990]     → CommandPalette (global search)
z-[9999]     → Toast notifications
```

---

### 5.8. Quy Tắc Kiểm Tra Trước Khi Merge (Pre-merge Checklist)

Trước khi merge bất kỳ component mới hoặc feature mới, kiểm tra:

- [ ] TypeScript: `npx tsc --noEmit` → 0 errors
- [ ] Spacing: Không có `p-2`, `p-3`, `gap-2`, `gap-3` ở container chính
- [ ] Radius: Đúng cấp (`rounded-2xl` / `rounded-xl` / `rounded-full`)
- [ ] Dark mode: Mọi element có `dark:` token tương ứng
- [ ] Modal: Có backdrop dismiss + Escape + X button + footer pills
- [ ] Z-index: Đúng thứ tự phân cấp
- [ ] Glass: Island headers dùng `backdrop-blur-md bg-white/85 dark:bg-zinc-900/85`


---

### 5.9. Quy Tắc Chi Tiết Bổ Sung & Chống Tái Lập (v2.1 — 2026-11-15)

1. **Tuyệt Đối Không Tự Sinh Mã Dự Án (No Arbitrary Project Code)**:
   - Sidebar chỉ hiển thị tên dự án và avatar TT gradient, **tuyệt đối không hiển thị dòng `Mã dự án: HCC/JIRA`** làm rối bố cục.

2. **Sidebar Icon Đồ Họa Đặc (Solid Fill Icons)**:
   - Toàn bộ icon phân hệ Sidebar dùng icon đặc hoặc có fill (`fill-current`) để tạo cảm giác đậm đà, chắc chắn và cao cấp tương tự Tammi OA / iOS modern.

3. **Thanh Tìm Kiếm Auto-Layout Cân Đối Giữa & Stroke Viền Mảnh**:
   - Thanh search ở Header phải căn giữa tuyệt đối (`flex-1 min-w-0 flex justify-center`), viền mảnh `border border-[#D7D7D7]/80 dark:border-zinc-700/80` để người dùng nhận diện rõ ràng vùng nhập liệu.

4. **Kanban Card Hover & Chống Lẹm Header (Anti-Clipping Hover)**:
   - Header cột Kanban luôn sticky `rounded-t-2xl` với đường viền phân cách `border-b border-[#E5E7EB] dark:border-zinc-800`.
   - Danh sách thẻ có padding trên `pt-4` (16px) và khoảng cách giữa các thẻ `space-y-4` (16px).
   - Thẻ `IssueCard` khi hover **tuyệt đối không dùng `hover:-translate-y`** gây lẹm vào header; thay vào đó sử dụng `hover:shadow-md hover:ring-1 hover:ring-[#EE0033]/30` để giữ trọn vẹn vị trí.

5. **Đảo Nổi Bảng Lộ Trình (Timeline) & Các Bảng Khác**:
   - Toàn bộ khung bảng Lộ trình (Timeline Gantt) và Bảng Quản trị (Admin) **phải được bọc trong container Đảo nổi bo góc `rounded-2xl` có viền `border-[#E5E7EB] dark:border-zinc-800` và cách lề `m-4 mt-0`**, tuyệt đối không để bảng tràn mép tạo góc vuông sắc nhọn.

6. **Đảo Nổi Thuộc Tính Trong Task Detail Drawer**:
   - Khung thuộc tính bên phải `IssueDetailDrawer` là thanh phẳng tích hợp `p-5 bg-slate-50/70 dark:bg-zinc-900/60 md:border-l border-slate-200 dark:border-zinc-800 space-y-4`, không lồng card đảo đôi gây teo tóp layout.
   - Hộp "Gợi Ý Phân Phối" có kích thước thoáng, nút bấm viên thuốc không bị chèn ép hay tràn viền.

7. **Xóa Bỏ Triệt Để Thuật Ngữ "Jira" Khỏi Giao Diện Người Dùng**:
   - Toàn bộ nhãn, thông báo, tiêu đề, modal phím tắt, command palette chỉ được dùng thương hiệu cá nhân **TamTask**, thuật ngữ tiếng Việt ("Hệ thống", "Công việc", "Chu kỳ"). Nghiêm cấm hiển thị "Jira Shortcuts", "Jira Rich-Text", "Jira Board".

---

### 5.10. Quy Chuẩn Đăng Nhập & Biểu Đồ & Cuộn Bảng (v2.2 — 2026-11-15)

1. **Màn Hình Đăng Nhập Tammi OA Aesthetic (`LoginModal.tsx`)**:
   - Overlay backdrop: `bg-slate-900/60 dark:bg-black/75 backdrop-blur-md`.
   - Khung modal: `rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-w-sm p-7`.
   - Input dạng viên nang bo cong `rounded-2xl pl-10 pr-4 py-2.5 bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700`.
   - Nút CTA chính: màu đỏ Viettel `#EE0033` bo tròn `rounded-full py-3 shadow-md shadow-[#EE0033]/20`.

2. **Cơ Chế Cuộn Bảng Kanban Toàn Trang (Natural Flow & Sticky Column Headers)**:
   - Tuyệt đối **không đặt thanh cuộn nội bộ** trong từng cột Kanban (`no overflow-y-auto per column`).
   - Các cột Kanban co giãn theo chiều dọc tự nhiên theo số lượng task, cho phép cuộn toàn bộ bảng mượt mà.
   - Header của cột Kanban luôn được ghim cố định `sticky top-0 z-10 rounded-t-2xl bg-white dark:bg-zinc-900 border-b border-[#E5E7EB] dark:border-zinc-800` khi người dùng cuộn xem các task bên dưới.

3. **Biểu Đồ Dashboard Chuẩn Dark Mode & Bo Góc `rounded-2xl`**:
   - Tất cả 5 khối biểu đồ (CFD, Burndown, Burnup, Velocity, Workload) đều đặt trong container `bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs`.
   - Toàn bộ `<Tooltip />` của Recharts phải có prop `contentStyle` nền tối `rgba(24,24,27,0.95)`, viền `rgba(63,63,70,0.8)`, bo góc `1rem` và chữ sáng.
   - Khoảng cách giữa các khối biểu đồ đồng bộ chuẩn `gap-4` (16px).

4. **Tự Động Chuyển Giao Diện Theo Thời Gian Thực Thiết Bị**:
   - Nếu người dùng chưa từng chọn thủ công theme, hệ thống tự động kích hoạt Dark Mode khi thiết bị ở chế độ tối (`prefers-color-scheme: dark`) HOẶC theo khung giờ ban đêm (từ 18h tối đến 6h sáng).

---

### 5.11. Quy Chuẩn Đồ Họa Nền Isometric Đăng Nhập & Lựa Chọn Tài Khoản Google (v2.3 — 2026-11-15)

1. **Đồ Họa Minh Họa Nền Isometric (`AuthBackgroundIllustration.tsx`)**:
   - Lấy cảm hứng từ bố cục minh họa 2 bên của Atlassian Jira nhưng chuyển toàn bộ sang hệ nhận diện **TamTask - Tone Hồng Đỏ chuẩn Viettel** (`#EE0033`, `#C7002B`, `#FDA4AF`, `#FFF1F2`).
   - **Góc trái dưới**: Đảo kỹ thuật công nghệ isometric (nền tảng 3 tầng xếp chồng, màn hình bảng Kanban đa sắc, tháp máy chủ rack LED chỉ thị xanh/đỏ, kỹ sư TamTask với trang phục đỏ Viettel/san hô).
   - **Góc phải dưới**: Đảo tài liệu & phân tích chất lượng isometric (Checklist tài liệu có dấu tích xanh nghiệm thu, kính lúp 3D phản chiếu ánh đỏ `#EE0033`, thẻ thống kê hiệu suất Velocity 98.5%, bút vẽ dự án, nhân viên QA kiểm thử).
   - **Hiệu ứng nền**: Radial glow ánh hồng đỏ dịu mắt (`#EE0033`/15, rose-500/10) và ma trận hạt chấm mờ (dot matrix) tạo cảm giác không gian công nghệ hiện đại.
   - **Phạm vi áp dụng**: Áp dụng đồng bộ cho cả **Màn hình Đăng nhập Chính** (`AuthLandingScreen.tsx`) và **Màn hình Đang Chờ Phê Duyệt Phân Quyền** (`PendingApprovalScreen.tsx`).

2. **Quy Chuẩn Chọn Tài Khoản Google OAuth (`prompt: "select_account"`)**:
   - Khi người dùng bấm nút *"Tiếp tục với Google"*, NextAuth **bắt buộc** phải kích hoạt màn hình chọn tài khoản của Google thay vì tự động đăng nhập tài khoản Google đang lưu phiên.
   - Triển khai kép:
     - Trong `src/lib/auth.ts`: Khai báo `authorization: { params: { prompt: "select_account", access_type: "offline", response_type: "code" } }` trong `GoogleProvider`.
     - Trong các components gọi `signIn("google", ...)`: Luôn kèm tham số thứ ba `{ prompt: "select_account" }`.

3. **Bảo Tồn Toàn Bộ Tính Năng Xác Thực Hiện Có**:
   - Mọi cải tiến về mặt hình ảnh và background tuyệt đối không làm ảnh hưởng hay mất đi các tính năng: Đăng nhập mật khẩu, luồng 2FA OTP qua email 6 chữ số, đồng hồ đếm ngược 5 phút, gửi lại mã, màn hình chờ xét duyệt và cơ chế tự động làm mới trạng thái.

---

### 5.12. Quy Chuẩn Đồng Bộ Tuyệt Đối Dark Mode, Motion Graphics & Căn Gióng Khung Nhìn (v2.4 — 2026-11-15)

1. **Bắt Buộc Hỗ Trợ 100% Cặp Màu Dark Mode & Light Mode**:
   - Mọi thành phần giao diện khi được thêm mới hoặc chỉnh sửa (bao gồm các view chính, slide-over drawer, modals, floating action bar, dropdowns, inputs, rich-text editor) đều phải khai báo song song lớp `dark:` tương ứng.
   - Trình soạn thảo mô tả công việc (`TiptapEditor.tsx`): Nền editor, thanh công cụ, các nút định dạng, vùng văn bản soạn thảo, tiêu đề H1-H3, trích dẫn, khối mã, placeholder bắt buộc phải hỗ trợ đầy đủ `dark:text-zinc-100`, `dark:bg-zinc-900`, `dark:border-zinc-700`. Tuyệt đối không để xảy ra hiện tượng chữ đen trên nền tối.
   - Thẻ và huy hiệu công việc (Epic, Priority, Status): Text trong Dark Mode bắt buộc phải qua xử lý nâng luminance (sử dụng hàm `getLightenedColor` hoặc CSS variables `[color:var(--epic-c-dark)]`) để chữ hiển thị sáng rực, rõ ràng và có độ tương phản cao, không bị chìm chữ.
   - Bảng Quản trị Người Dùng (`AdminView.tsx`): Dropdown phân quyền vai trò, huy hiệu trạng thái tài khoản, số lượng task phụ trách, nút thao tác khóa/mở khóa tài khoản phải đồng bộ hoàn toàn với Dark Mode.
   - Toàn bộ các hộp thoại chu kỳ Sprint (`CreateSprintModal.tsx`, `EditSprintModal.tsx`, `ClosedSprintsModal.tsx`, `CompleteSprintModal.tsx`): Cấu trúc khung `dark:bg-zinc-900 dark:border-zinc-800`, text `dark:text-zinc-100`, inputs `dark:bg-zinc-800 dark:border-zinc-700`.

2. **Căn Gióng Hoàn Hảo & Đồng Bộ Khoảng Cách (16px Grid Alignment)**:
   - **Khoảng cách Sidebar và Views**: Khoảng cách từ thanh Sidebar đến nội dung bên trong các mục được quy chuẩn cố định đúng **16px** (`gap-4` / `pl-4`).
   - **Thẳng hàng cạnh trên (Top Alignment)**: Cạnh trên của thanh Sidebar và cạnh trên của thanh Island Header của các View (Bảng Công Việc, Kế Hoạch Chu Kỳ, Lộ Trình Tiến Độ, Báo Cáo & Thống Kê, Quy Tắc Tự Động, Quản Trị Hệ Thống) phải thẳng hàng tuyệt đối với nhau (cùng cách mép dưới của Navbar đúng 16px - `pt-4`).
   - **Thẳng hàng trục đứng Logo TamTask (Vertical Axis Alignment)**: Logo TamTask và nhãn hiệu trên Navbar được căn gióng lề trái (`md:pl-4`) sao cho tâm và mép trái của Icon TT trên Navbar thẳng hàng tuyệt đối theo trục dọc với Icon TT của thanh Sidebar khi thanh Sidebar ở trạng thái thu gọn (`isCollapsed = true`, `w-16`).

3. **Motion Graphics Nền Màn Hình Đăng Nhập & Chuyển Đổi Giao Diện (Theme Switcher)**:
   - Màn hình đăng nhập (`AuthLandingScreen.tsx`) và Màn hình chờ duyệt (`PendingApprovalScreen.tsx`) được trang bị nút chuyển đổi Dark / Light mode (icon Sun/Moon) ở góc trên bên phải, cho phép người dùng chủ động chọn giao diện ưa thích ngay từ màn hình xác thực.
   - Background Isometric (`AuthBackgroundIllustration.tsx`) được tích hợp các chuyển động Motion Graphics tinh tế (khối hình 3D lơ lửng `anim-float-1`, `anim-float-2`, nhịp thở `anim-float-3`, đèn LED chỉ thị trạng thái) tạo cảm giác hiện đại, cao cấp.
   - **Quy chuẩn bảo vệ thị giác Dark Mode**: Ở chế độ Dark Mode, toàn bộ các luồng ánh sáng radial glow và hiệu ứng nền được hạ thấp cường độ (`dark:opacity-30`, `dark:from-rose-950/20`), đảm bảo không gian trầm ấm, sang trọng và không gây chói mắt người dùng.

