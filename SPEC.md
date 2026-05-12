# PRODUCT SPECIFICATION: NEURO-NAV (THE DEVELOPER'S MICRO-OS)

**Version:** 3.0.0 (Ultimate Edition)
**Target Platform:** Chromium-based Browsers (Chrome, Edge) & Windows/WSL2 Environment
**Architecture Pattern:** Clean Architecture & Event-Driven Micro-services

## 1. Narrative Charter Statement

Neuro-Nav là một Hệ điều hành vi mô (Micro-OS) tích hợp thẳng vào trình duyệt, được thiết kế chuyên biệt cho kỹ sư phần mềm. Bằng cách kết hợp mô hình quản lý phiên bản (Git-flow), trí tuệ nhân tạo cục bộ (WebGPU LLM) và giao thức mạng P2P (WebRTC), dự án giải quyết triệt để tình trạng phân mảnh ngữ cảnh khi xử lý các hệ thống phức tạp (như microservices hay nested repositories). Toàn bộ dữ liệu được lưu trữ và tính toán 100% tại máy khách (Client-side), đảm bảo tốc độ phản hồi tính bằng mili-giây và bảo mật riêng tư tuyệt đối.

---

## 2. System Architecture Design

Hệ thống tuân thủ Clean Architecture, tách biệt thành 4 phân lớp:

1. **Presentation Layer (UI/UX):** Xây dựng bằng ReactJS. Quản lý State bằng RTK Query để đồng bộ dữ liệu theo thời gian thực giữa Popup, Options Page và Background Script mà không gây re-render thừa.
2. **Background Processing (Service Worker):** Đóng vai trò là Message Broker. Quản lý hàng đợi (Queue) các sự kiện của trình duyệt. Các tác vụ nặng được đẩy vào Web Workers.
3. **Local Core Engine:**
* *Vector & Metadata DB:* Sử dụng IndexedDB kết hợp engine Orama để lưu trữ và truy vấn vector siêu tốc.
* *AI Inference:* Sử dụng WebGPU thông qua WebLLM (cho tác vụ ngôn ngữ tự nhiên) và Transformers.js qua WASM (cho tác vụ Embedding).


4. **External Interfaces:**
* Local WebSocket Server (giao tiếp với Terminal/CLI).
* WebRTC Data Channels (Đồng bộ P2P không cần máy chủ).
* Native File System Access API (Đọc file hệ thống).
* Chrome DevTools Protocol - CDP (Lắng nghe Network/Console).



---

## 3. Lộ Trình Phát Triển & WBS (Phân chia Phase Nghiêm Ngặt)

*Nguyên tắc thực thi: Mỗi Phase yêu cầu hoàn thiện 100% Core Logic, pass toàn bộ Unit Test trước khi chuyển sang Phase tiếp theo.*

### PHASE 1: THE FOUNDATION (Hạ tầng Cốt lõi & Quản lý Session)

*Mục tiêu: Đảm bảo khả năng kiểm soát Tab/Window cơ bản và thiết lập cấu trúc lưu trữ nội bộ.*

* **1.1. Core Boilerplate & UI:** Khởi tạo project với ReactJS, TailwindCSS. Thiết lập cầu nối Message Passing giữa UI và Service Worker.
* **1.2. Active State Management:** Lắng nghe và hiển thị các tab đang mở. Lưu trữ trạng thái vào IndexedDB.
* **1.3. Smart Workspaces (Set Action):** Lưu trữ các bộ Tab thành cấu trúc JSON độc lập. Cho phép Export/Import và khởi động hàng loạt Tab (ví dụ: mở đồng loạt giao diện quản trị, API docs và Jira dashboard).
* **1.4. Auto-Pruning:** Viết cronjob chạy ngầm dọn dẹp dữ liệu lịch sử vượt quá 30 ngày để tối ưu RAM.

### PHASE 2: VERSION CONTROL & TERMINAL (Git-flow & CLI Integration)

*Mục tiêu: Đưa tư duy dòng lệnh và quản lý mã nguồn vào trình duyệt.*

* **2.1. Session Branching:** Tạo tính năng `checkout` nhánh trình duyệt. Chuyển đổi toàn bộ ngữ cảnh tab khi thay đổi nhánh (VD: từ `feat/auth` sang `bugfix/payment`).
* **2.2. Stash & Pop Memory:** Lưu trữ (Stash) toàn bộ tab hiện tại vào bộ nhớ đệm đóng băng và dọn dẹp Window. Cho phép khôi phục (Pop) nguyên vẹn trạng thái trước đó.
* **2.3. Local WebSocket Server:** Mở một port cục bộ trên máy tính từ Background Script.
* **2.4. `nav-cli` Tool:** Đóng gói một package npm CLI. Cho phép lập trình viên đứng từ terminal WSL2 gõ lệnh `nav branch checkout unibuddy` để tự động điều khiển trình duyệt trên host Windows.

### PHASE 3: THE BRAIN (Trí tuệ nhân tạo cục bộ - Local RAG)

*Mục tiêu: Loại bỏ hoàn toàn tìm kiếm từ khóa tĩnh, chuyển sang phân tích ngữ nghĩa.*

* **3.1. DOM Text Extraction:** Trích xuất nội dung văn bản thuần của các trang web sau 15 giây truy cập, loại bỏ các thẻ HTML rác.
* **3.2. Local Vectorization (WASM):** Đưa Transformers.js vào Web Worker, chạy model `all-MiniLM-L6-v2` để chuyển đổi Text thành Vector Embeddings lưu vào IndexedDB.
* **3.3. Semantic Command Palette:** Tạo giao diện `Cmd/Ctrl + K`. Tích hợp Orama để tìm kiếm ngữ nghĩa theo ngôn ngữ tự nhiên.
* **3.4. Auto-Tagging & Intent Blocker:** Tự động gán nhãn `[Tech]`, `[Media]`, `[Docs]` dựa trên nội dung. Chặn các trang gây xao nhãng (như mạng xã hội) theo ngữ cảnh (chỉ chặn khi ở branch `feat/*`, không chặn khi ở branch `chill`).

### PHASE 4: TELEMETRY & VISUALIZATION (Trực quan hóa & Gỡ lỗi)

*Mục tiêu: Biến lịch sử duyệt web thành bản đồ tư duy và công cụ debug.*

* **4.1. Graph Node Visualization:** Sử dụng D3.js hoặc React Flow, vẽ sơ đồ đồ thị 2D mạng lưới các trang web đã đi qua, nối với nhau bằng các "luồng click" (edges). Giúp tái hiện quá trình research các lỗi phức tạp.
* **4.2. E2E Test Generator:** Lắng nghe DOM Events (Click, Input, Form Submit). Xuất toàn bộ hành trình tương tác thành script Playwright/Cypress hợp lệ.
* **4.3. Auto-Debugger Agent (CDP):** Gắn API `chrome.debugger` vào các tab thuộc `localhost`. Tự động bắt Stack Trace từ Console hoặc mã HTTP 500 từ Network, đưa vào Local AI để đề xuất hướng fix lỗi trực tiếp trên giao diện popup.

### PHASE 5: SYMBIOTIC ENVIRONMENT (Hệ sinh thái Cộng sinh & Đồng bộ mạng lưới)

*Mục tiêu: Thoát khỏi Sandbox của trình duyệt, vươn ra hệ điều hành và kết nối mạng.*

* **5.1. Project Auto-Discovery:** Sử dụng Native File System Access API. Cấp quyền cho extension đọc thư mục code gốc. Extension tự quét file `package.json`, `.wslconfig` hoặc `.git` để tự động sinh ra các Workspace tĩnh tương ứng với công nghệ đang dùng (ví dụ: phát hiện cấu hình Swap WSL, tự mở Docs của Microsoft).
* **5.2. P2P WebRTC Data Sync:** Đồng bộ hóa toàn bộ Vector DB, cấu hình Workspace, và lịch sử giữa nhiều máy tính cá nhân bằng kết nối ngang hàng (WebRTC Data Channel), không qua máy chủ trung gian.
* **5.3. Multiplayer Co-Browsing:** Sử dụng WebRTC để tạo tính năng Share Session. Hai người dùng ở hai máy khác nhau có thể chung một ngữ cảnh duyệt web (đồng bộ cuộn trang, click chuột trên các tab tài liệu mở chung).
* **5.4. WebGPU LLM Acceleration:** Tích hợp mô hình ngôn ngữ lớn (SLM như Phi-3-mini) chạy trực tiếp bằng WebGPU, cho phép Agent giao tiếp, tóm tắt tài liệu và phân tích code ngay trên máy khách với tốc độ xử lý phần cứng.

---

Dưới đây là quyết định và làm rõ cho từng vấn đề:

### 1. CLI Transport Mechanism (MV3 Sandbox)

**Quyết định: Chọn Option B (Companion WebSocket server)**

Option B là sự lựa chọn tối ưu tuyệt đối. Việc giao tiếp xuyên biên giới giữa một máy chủ Windows (nơi trình duyệt hoạt động) và một môi trường Ubuntu (nơi các lệnh terminal thực thi) có thể trở thành một cơn ác mộng định tuyến nếu sử dụng Native Messaging Host. Native Messaging đòi hỏi phải can thiệp sâu vào Registry của Windows và cài đặt các file manifest phức tạp, điều này làm hỏng trải nghiệm "cài đặt trong một click" của extension.

Bằng cách dựng một WebSocket server nhỏ chạy ngầm ở Background Script, CLI tool chỉ cần bắn payload tới `ws://localhost:PORT`. Giao thức này mượt mà, dễ debug và thân thiện với kiến trúc microservices.

### 2. P2P Signaling (Phase 5)

**Quyết định: Chọn Option B (Tiny public signaling relay - PeerJS) kết hợp Option C (Fallback)**

Copy-paste mã SDP token (Option A) mang lại trải nghiệm người dùng quá thô sơ và không phù hợp với một sản phẩm mang mác "Hệ điều hành vi mô".

Sử dụng một public signaling server như PeerJS Cloud là phương án cân bằng hoàn hảo. Nó giải quyết được khâu "bắt tay" (handshake) ban đầu một cách tự động chỉ qua một Peer-ID ngắn gọn. Dữ liệu thực sự (Vector DB, History) sau đó vẫn được truyền P2P qua WebRTC Data Channels, đảm bảo tính riêng tư. Để dự phòng trường hợp PeerJS Cloud bị sập hoặc limit, chúng ta có thể chèn thêm Option C: cho phép user tạo QR code hoặc URL chứa SDP token rút gọn để quét và kết nối thủ công.

### 3. WebGPU Model Selection (VRAM Constraints)

**Quyết định: Mặc định TinyLlama-1.1B, cho phép Upgrade lên Phi-3-mini**

Thực tế khi vận hành các môi trường phát triển cục bộ phức tạp, việc phải tự tay phân bổ giới hạn RAM hay dung lượng Swap cho các hệ thống ảo hóa để duy trì các database container là chuyện diễn ra hàng ngày. Một trình duyệt extension không thể được phép "nuốt chửng" toàn bộ VRAM và gây giật lag cho các công cụ code chính.

Do đó, kiến trúc nên được thiết kế theo hướng tăng dần (Progressive Enhancement):

* **Mặc định (Default):** Tải model TinyLlama-1.1B (~700MB VRAM). Nó đủ nhanh để thực hiện các tác vụ phân loại tab, auto-tagging và tóm tắt cơ bản mà không làm nóng máy.
* **Tùy chọn Nâng cao (Opt-in):** Trong trang Settings, cung cấp nút "Enable Pro Agent", cho phép người dùng có GPU mạnh tải xuống Gemma-2-2B hoặc Phi-3-mini để xử lý các câu lệnh Semantic RAG phức tạp.

### 4. TailwindCSS Version

**Quyết định: Đồng ý sử dụng TailwindCSS v4**

Phiên bản v4 với cấu trúc CSS-first (loại bỏ file `tailwind.config.js` cồng kềnh) hoàn toàn phù hợp với tư duy Clean Architecture của dự án. Nó giúp file bundle của extension gọn gàng hơn, giảm thiểu dung lượng tải tĩnh và tăng tốc độ build trong quá trình phát triển UI.

---