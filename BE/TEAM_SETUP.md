# 🚀 Team MongoDB Setup Guide

## MongoDB Server Info
- **Server Host**: `192.168.56.1`
- **Port**: `27017`
- **Database**: `Altera`

## For Team Members (Người còn lại)

### Bước 1: Copy Connection String
```
mongodb://192.168.56.1:27017/Altera
```

### Bước 2: Cập nhật `.env`
Mở file `.env` trong project và sửa dòng:

**Từ:**
```
MONGODB_URI=mongodb://localhost:27017/Altera
```

**Thành:**
```
MONGODB_URI=mongodb://192.168.56.1:27017/Altera
```

### Bước 3: Khởi động project
```bash
npm run dev
```

## Yêu cầu Firewall
- Đảm bảo firewall cho phép port 27017
- Nếu không kết nối được, kiểm tra Windows Firewall:
  - Cho phép MongoDB qua firewall
  - Hoặc tạm thời tắt firewall (chỉ khi dev)

## ⚠️ Important Notes
- **IP Address của máy chủ**: `192.168.56.1` - Hãy kiểm tra lại nếu khác
- **Chỉ dùng khi dev team** - Không để mở sau khi project hoàn thành
- Nếu thay đổi MongoDB binding, phải restart lại

## Troubleshooting

**Lỗi: "connect ECONNREFUSED 192.168.56.1:27017"**
- MongoDB service chưa chạy
- Firewall chặn port 27017
- IP sai (chạy `ipconfig` để kiểm tra)

**Cách kiểm tra:**
```bash
# Test connection
mongosh --host 192.168.56.1:27017
```

---
**Last Updated**: 2026-06-22
