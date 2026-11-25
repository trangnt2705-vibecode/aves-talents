# App tuyển dụng AVES

Web app theo dõi tuyển dụng: nhập CV, cập nhật từng khâu, dashboard tổng hợp, bảng Kanban, tiến độ theo tháng.
Trang tĩnh (HTML + JS) chạy trên Vercel, dữ liệu và đăng nhập nằm trên Supabase.

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html` | Giao diện và toàn bộ màn hình |
| `logic.js` | Quy tắc tính khâu, SLA, trạng thái, tiến độ tháng, đọc file Excel |
| `store.js` | Lớp đọc/ghi dữ liệu Supabase (realtime) |
| `config.js` | URL và khoá anon của Supabase, bật/tắt đăng nhập Google/Microsoft |
| `supabase/schema.sql` | Tạo bảng, phân quyền (RLS), realtime, tài khoản admin đầu tiên |
| `supabase/seed.sql` | Dữ liệu ứng viên: KHÔNG đưa lên GitHub, chỉ chạy trực tiếp trong Supabase |

## Cài đặt lần đầu

1. **Supabase → SQL Editor**: mở `supabase/schema.sql`, sửa email admin ở cuối file thành email của chị, chạy. Sau đó chạy `supabase/seed.sql`.
2. **Supabase → Authentication → URL Configuration**: Site URL = link Vercel (ví dụ `https://aves-tuyen-dung.vercel.app`), thêm cùng link đó vào Redirect URLs.
3. **`config.js`**: điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` (Project Settings → API). Không bao giờ đặt khoá `service_role` vào đây.
4. **Vercel**: Add New → Project → Import repo này → Deploy (không cần cấu hình build).

## Phân quyền

- **Admin**: toàn quyền, quản lý người dùng ở tab Người dùng.
- **Editor**: thêm, sửa dữ liệu.
- **Viewer**: chỉ xem.

Chỉ email có trong danh sách người dùng mới xem được dữ liệu. Quyền được kiểm tra ở database (Row Level Security), không chỉ ở giao diện.

## Đăng nhập Google / Microsoft (tuỳ chọn)

Mặc định đăng nhập bằng link gửi qua email (dùng được với mọi email). Muốn thêm nút Google hoặc Microsoft:
bật provider trong Supabase → Authentication → Providers (cần tạo OAuth client ở Google Cloud hoặc Azure),
rồi đặt `LOGIN_GOOGLE` / `LOGIN_MICROSOFT` thành `true` trong `config.js`.
