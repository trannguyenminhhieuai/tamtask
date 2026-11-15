# Workspace Guidelines & Mouse-1 Guard (Fast Autonomous Coding)

This workspace is integrated with **Mouse-1 Safeguards** via Antigravity lifecycle hooks (`.agents/hooks.json`).

### 1. Fast Development & Autonomy Directive:
- **Code Proactively**: Implement components, pages, APIs, and types swiftly without asking unnecessary permissions for standard coding tasks.
- **Mouse-1 Automated Guardrails**: All tool executions (`run_command`, edits, builds) are automatically pre-screened in ~100ms by Mouse-1 to ensure safety while enabling rapid pair-programming.

### 2. Guardrails Enforced by Mouse-1:
1. **Hard Deny (Immediate block):**
   - Dropping or deleting database tables or production collections without confirmation.
   - Exposing `.env` files, raw credentials, or secret keys in public commits or logs.
   - Destructive system-level commands (e.g. `rm -rf /`, formatting, deleting critical files).
2. **Soft Deny (Requires Review):**
   - Publishing packages to external registries (npm, pypi).
   - Direct force-pushing to main remote branches.
3. **Allowed Operations (Proceed Fast):**
   - Reading, viewing, searching, creating, and editing code files, documentation, and tests in the workspace.
   - Running test suites (`npm test`, `npm run dev`, `npm run build`, `pytest`, `python`).
   - Standard local development commands.

---

### 3. Core Architectural Rules for Agent (Bộ Quy Tắc Bắt Buộc Khi Thực Thi Giao Diện & Dữ Liệu):

#### A. Quy tắc Xếp tầng hiển thị (CSS Stacking Context & Z-Index Standard):
- **Phân cấp z-index chuẩn mực**:
  - `z-0`: Nội dung chính (Workspace, Kanban Board, Backlog View, Timeline View, Dashboard).
  - `z-10` - `z-20`: Header cột cuộn, thanh bar cố định bên trong views.
  - `z-30`: Thanh điều hướng trên cùng (`Navbar Header`). Tuyệt đối **không** dùng `z-[60]` trở lên cho Header để tránh che khuất Drawer/Modal.
  - `z-40` - `z-50`: Menu thả xuống cục bộ của Navbar (Project dropdown, Notification, Profile popover).
  - `z-[70]`: Toàn bộ các ngăn kéo trượt (`Slide-over Drawers` như `IssueDetailDrawer`). Luôn phủ đè lên Header (`z-30`) và Workspace (`z-0`).
  - `z-[80]`: Toàn bộ các hộp thoại / cửa sổ nổi (`Modals / Popups` như `CreateIssueModal`, `ProjectMembersModal`, `WorkflowSettingsModal`, etc.). Luôn nổi trên cùng, phủ đè lên cả Drawer và Header.
  - `z-[9990]`: Thanh tìm kiếm nhanh toàn hệ thống (`CommandPalette`).
  - `z-[9999]`: Thông báo hệ thống (`Toast notifications`).

#### B. Quy tắc Tương tác Modal & Drawer (Backdrop & Keyboard Dismissal):
- Mọi Drawer và Modal **bắt buộc** phải:
  1. Cho phép đóng khi nhấp chuột ra ngoài vùng tối (Backdrop Overlay) thông qua `onClick={onClose}` tại container ngoài cùng và `onClick={(e) => e.stopPropagation()}` tại thẻ chứa nội dung hộp thoại.
  2. Bắt sự kiện phím `Escape` (`keydown`) để đóng nhanh tức thì.
  3. Có nút đóng `X` trực quan và nút `Đóng` / `Hủy` ở chân trang.

#### C. Quy tắc Phân quyền & Cô lập Nhân sự theo Dự án (Project Member Scoping):
- **Quyền truy cập dự án**:
  - Tài khoản `ADMIN`: Được xem và quản lý toàn bộ các dự án trên hệ thống.
  - Tài khoản thông thường (`PROJECT_LEAD`, `DEVELOPER`, `QA`, `VIEWER`): **Chỉ** được hiển thị và truy cập các dự án mà mình là Thành viên (`project.members`) hoặc Trưởng dự án (`project.leadId`). Tuyệt đối không để lộ dự án khác trong bộ chọn dự án.
- **Phân công & Lọc công việc (Task Assignment & Kanban Filtering)**:
  - Danh sách phân công người thực hiện (`CreateIssueModal`, `IssueDetailDrawer`, bulk assign trong `BacklogView`) **chỉ** được chứa nhân sự thuộc dự án hiện tại (`currentProject.members` + `currentProject.lead`). Tuyệt đối không tự ý thêm người dùng ngoài dự án.
  - Bộ lọc Avatar và Swimlane trên Kanban **chỉ** hiển thị các nhân sự thuộc dự án hiện hành.

#### D. Quy tắc Chuẩn hóa Nhận diện Thương hiệu & Trải nghiệm Người Dùng (UI/UX Excellence):
- Giữ vững màu đỏ chuẩn Viettel `#EE0033` cho các nút hành động chính, active tabs, và điểm nhấn quan trọng.
- Đảm bảo Drawer và Modal tương thích hoàn hảo trên thiết bị di động (`w-full md:max-w-4xl`).

#### E. Quy tắc Bắt Buộc Hỗ Trợ Kép Dark Mode & Light Mode (100% Dual Theme Standard):
- **Nguyên tắc cốt tử**: Khi tạo mới hoặc cập nhật bất kỳ Feature, Component, Page, Modal hay Drawer nào, **BẮT BUỘC** phải triển khai đầy đủ cả 2 chế độ Dark Mode và Light Mode. Tuyệt đối không để lẫn lộn màu sáng trong Dark Mode hoặc ngược lại.
- **Quy chuẩn Form Controls & Inputs**:
  - Toàn bộ `input`, `textarea`, `select` và các thẻ `<option>` phải có cấu trúc: `bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500`.
  - Không được dùng class nền tĩnh `bg-white`, `bg-gray-50`, `bg-slate-100` mà thiếu tiền tố `dark:`.
- **Quy chuẩn Badges & Tags (Epic, Priority, Status)**:
  - Text trong Dark Mode bắt buộc phải có độ tương phản cao (lightness >= 70%), không được dùng thẳng màu hex sẫm của Light Mode lên nền tối khiến chữ bị chìm.
  - Priority badge phải có cặp class `dark:bg-...-950/40 dark:text-...-400 dark:border-...-900/60`.
- **Quy chuẩn Khoảng Cách & Căn Giáp (Layout Alignment & Spacing)**:
  - Khoảng cách giữa Sidebar và các Views trong hệ thống luôn đồng bộ chuẩn **16px** (`gap-4`, `p-4`).
  - Cạnh trên của Island Header của mỗi View phải thẳng hàng tuyệt đối với cạnh trên của Sidebar (`pt-4 = 16px`).
  - Logo thương hiệu TamTask trong Navbar căn thẳng hàng theo trục đứng với icon trong Sidebar khi Sidebar thu gọn (`w-16`).



