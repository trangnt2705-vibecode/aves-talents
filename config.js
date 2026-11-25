/* Cấu hình kết nối. SUPABASE_ANON_KEY là khoá công khai (anon public), được phép đặt ở đây.
   Tuyệt đối không đặt khoá service_role vào file này. */
window.APP_CONFIG = {
  SUPABASE_URL: "https://dntliefblcklhacjksmb.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_eGZAUG5sfSCp1Dv-bq-EMQ_No-9bL_j",
  LOGIN_GOOGLE: false,     // bật sau khi cấu hình Google trong Supabase > Authentication > Providers
  LOGIN_MICROSOFT: false   // bật sau khi cấu hình Azure (Microsoft) trong Supabase
};
