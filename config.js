/* Cấu hình kết nối. SUPABASE_ANON_KEY là khoá công khai (anon public), được phép đặt ở đây.
   Tuyệt đối không đặt khoá service_role vào file này. */
window.APP_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  LOGIN_GOOGLE: false,     // bật sau khi cấu hình Google trong Supabase > Authentication > Providers
  LOGIN_MICROSOFT: false   // bật sau khi cấu hình Azure (Microsoft) trong Supabase
};
