# CloudScore - Hệ thống quản lý điểm học sinh

Hệ thống quản lý điểm số học sinh sử dụng:
- **Frontend**: GitHub Pages (HTML/CSS/JS)
- **Database**: Google Sheets
- **Backend**: Google Apps Script
- **Proxy**: Cloudflare Workers (bypass CORS)

## 🎯 Tính năng

- ✅ Hiển thị danh sách bản ghi dạng cards
- ✅ Thêm/Sửa/Xóa thông tin học sinh
- ✅ Quản lý cột điểm động (thêm/xóa cột tùy ý)
- ✅ Tìm kiếm theo tên, lớp
- ✅ Tự động lưu ngày giờ chỉnh sửa
- ✅ Giao diện responsive, thân thiện

## 📋 Hướng dẫn cài đặt

### Bước 1: Thiết lập Google Sheets

1. Tạo một Google Sheet mới tại [Google Sheets](https://sheets.google.com)
2. Đặt tên sheet (ví dụ: "StudentScores Database")
3. **Lưu ý**: Sheet sẽ tự động tạo cấu trúc khi chạy Apps Script lần đầu

### Bước 2: Thiết lập Google Apps Script

1. Mở Google Sheet vừa tạo
2. Vào **Extensions** > **Apps Script**
3. Xóa code mặc định
4. Copy toàn bộ nội dung file `google-apps-script.js` và paste vào
5. **Tùy chỉnh cấu hình** (dòng 5):
   ```javascript
   const SHEET_NAME = 'StudentScores'; // Tên sheet lưu dữ liệu
   ```
6. **Lưu project** (Ctrl+S), đặt tên (ví dụ: "CloudScore Backend")

7. **Deploy as Web App**:
   - Click nút **Deploy** > **New deployment**
   - Chọn type: **Web app**
   - Description: "CloudScore API"
   - Execute as: **Me**
   - Who has access: **Anyone** (quan trọng!)
   - Click **Deploy**
   - **Copy URL** được tạo (dạng: `https://script.google.com/macros/s/XXXXX/exec`)
   - Click **Authorize access** và cho phép quyền truy cập

8. **Test setup** (tùy chọn):
   - Chọn function `testSetup` từ dropdown
   - Click **Run**
   - Kiểm tra sheet để thấy dữ liệu test

### Bước 3: Thiết lập Cloudflare Worker

1. Đăng ký/Đăng nhập [Cloudflare](https://dash.cloudflare.com/)
2. Vào **Workers & Pages** > **Create application** > **Create Worker**
3. Đặt tên worker (ví dụ: `cloudscore-proxy`)
4. Click **Deploy** rồi **Edit code**
5. Xóa code mặc định
6. Copy toàn bộ nội dung file `cloudflare-worker.js` và paste vào
7. **Cập nhật cấu hình** (dòng 5):
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
   Thay `YOUR_SCRIPT_ID` bằng URL từ Bước 2.7
8. Click **Save and Deploy**
9. **Copy Worker URL** (dạng: `https://cloudscore-proxy.your-subdomain.workers.dev`)

### Bước 4: Cấu hình Frontend

1. Mở file `app.js`
2. Cập nhật cấu hình (dòng 2-5):
   ```javascript
   const CONFIG = {
       PROXY_URL: 'https://your-worker.your-subdomain.workers.dev',
   };
   ```
   Thay bằng Worker URL từ Bước 3.9

### Bước 5: Deploy lên GitHub Pages

#### Cách 1: Deploy thủ công (Simple)

1. **Tạo config.js local**:
   ```bash
   cp config.example.js config.js
   # Sửa URL trong config.js
   ```

2. **Tạo repository GitHub mới**:
   - Vào [GitHub](https://github.com/new)
   - Đặt tên repo (ví dụ: `cloudscore`)
   - Chọn Public
   - Create repository

3. **Push code lên GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cloudscore.git
   git push -u origin main
   ```

4. **Kích hoạt GitHub Pages**:
   - Vào **Settings** > **Pages**
   - Source: Deploy from a branch
   - Branch: `main` / `root`
   - Click **Save**

5. **Truy cập website**:
   - URL: `https://YOUR_USERNAME.github.io/cloudscore/`
   - Đợi vài phút để GitHub Pages build xong

⚠️ **Lưu ý**: `config.js` chứa URL sẽ được commit (vì không thể dùng secret với static pages)

---

#### Cách 2: Deploy tự động với GitHub Actions (Bảo mật hơn)

1. **Tạo GitHub Secret**:
   - Vào repository → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `PROXY_URL`
   - Secret: `https://proxyscore.mctran2005.workers.dev`
   - Click **Add secret**

2. **GitHub Actions đã được setup** (file `.github/workflows/deploy.yml`)

3. **Push code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with GitHub Actions"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cloudscore.git
   git push -u origin main
   ```

4. **Kích hoạt GitHub Pages**:
   - Vào **Settings** > **Pages**
   - Source: **GitHub Actions**
   - Workflow sẽ tự động chạy

5. **Kiểm tra deployment**:
   - Vào tab **Actions** để xem workflow chạy
   - Sau khi xong → URL: `https://YOUR_USERNAME.github.io/cloudscore/`

✅ **Ưu điểm**: 
- URL không bị lộ trong code
- Tự động deploy khi push
- Dễ thay đổi URL (chỉ cần sửa Secret)

---

### So sánh 2 cách:

| | Cách 1: Thủ công | Cách 2: GitHub Actions |
|---|---|---|
| **Độ khó** | ⭐ Dễ | ⭐⭐ Trung bình |
| **Bảo mật** | ⚠️ URL lộ trong code | ✅ URL ẩn trong Secret |
| **Auto deploy** | ❌ Phải push thủ công | ✅ Tự động khi push |
| **Phù hợp** | Demo, test | Production |

---

## 🚀 Sử dụng

### Thêm bản ghi mới
1. Click nút **"+ Thêm bản ghi mới"**
2. Nhập tên học sinh và lớp
3. Click **"+ Thêm cột điểm"** để thêm các cột điểm (VD: Điểm giữa kỳ, Điểm cuối kỳ...)
4. Nhập điểm số
5. Click **"💾 Lưu"**

### Xem/Chỉnh sửa bản ghi
1. Click vào card bất kỳ
2. Chỉnh sửa thông tin
3. Thêm/Xóa cột điểm bằng nút **"+ Thêm cột điểm"** hoặc **"×"**
4. Click **"💾 Lưu"** để lưu thay đổi

### Xóa bản ghi
1. Mở bản ghi cần xóa
2. Click **"🗑️ Xóa"**
3. Xác nhận xóa

### Tìm kiếm
- Gõ tên học sinh hoặc lớp vào ô tìm kiếm
- Kết quả hiển thị ngay lập tức

## 📁 Cấu trúc File

```
CloudScore/
├── index.html              # Trang chính
├── styles.css              # CSS styling
├── app.js                  # JavaScript logic
├── google-apps-script.js   # Google Apps Script (deploy riêng)
├── cloudflare-worker.js    # Cloudflare Worker (deploy riêng)
└── README.md               # Tài liệu này
```

## 🔧 Cấu trúc dữ liệu

### Google Sheets Columns
| ID | Record Name | Student Name | Class | Last Modified | Scores (JSON) |
|----|-------------|--------------|-------|---------------|---------------|
| record_123 | 6A8 - Nguyễn Văn A | Nguyễn Văn A | 6A8 | 2025-10-14T... | {"Điểm GK":"8.5","Điểm CK":"9.0"} |

### JSON Format (trong app.js)
```javascript
{
  id: "record_123",
  recordName: "6A8 - Nguyễn Văn A",
  studentName: "Nguyễn Văn A",
  studentClass: "6A8",
  lastModified: "2025-10-14T10:30:00.000Z",
  scores: {
    "Điểm giữa kỳ": "8.5",
    "Điểm cuối kỳ": "9.0",
    "Điểm thực hành": "8.0"
  }
}
```

## 🐛 Xử lý sự cố

### Lỗi: "Không thể tải dữ liệu"
- Kiểm tra Worker URL trong `app.js`
- Kiểm tra Apps Script URL trong `cloudflare-worker.js`
- Đảm bảo Apps Script được deploy với quyền "Anyone"

### Lỗi: CORS blocked
- Đảm bảo đã deploy Cloudflare Worker
- Kiểm tra CORS headers trong worker

### Dữ liệu không lưu
- Mở Google Sheet và kiểm tra xem có sheet tên `StudentScores` chưa
- Chạy function `testSetup` trong Apps Script
- Kiểm tra Console trong DevTools (F12) để xem lỗi

### Worker không hoạt động
- Vào Cloudflare Dashboard > Workers > Logs
- Kiểm tra real-time logs khi test
- Đảm bảo Apps Script URL đúng

## 🔐 Bảo mật

- **Cảnh báo**: Hệ thống này sử dụng "Anyone can access" cho Apps Script, nghĩa là bất kỳ ai có URL đều có thể truy cập
- **Khuyến nghị cho production**:
  - Thêm authentication (API key, OAuth)
  - Sử dụng Firebase hoặc backend riêng
  - Mã hóa dữ liệu nhạy cảm
  - Giới hạn rate limiting

## 📝 Tùy chỉnh

### Thay đổi màu sắc
Chỉnh sửa CSS variables trong `styles.css`:
```css
:root {
    --primary-color: #4285f4;
    --secondary-color: #34a853;
    --danger-color: #ea4335;
}
```

### Thay đổi layout cards
Chỉnh sửa grid trong `styles.css`:
```css
.cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
```

## 📞 Hỗ trợ

Nếu có vấn đề, vui lòng:
1. Kiểm tra lại các bước cài đặt
2. Xem Console trong DevTools (F12)
3. Kiểm tra Cloudflare Worker Logs
4. Tạo Issue trên GitHub

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa

## 🎉 Credits

Developed with ❤️ for education management
