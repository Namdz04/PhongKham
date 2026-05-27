// Dịch vụ AI/ML Gợi ý Chuyên khoa
// Bộ máy phân tích từ khóa triệu chứng trên máy khách để định hướng chuyên khoa phù hợp

const specialtyKeywords = {
  "Tim mạch": {
    keywords: ["tim", "nguc", "kho tho", "huyet ap", "dap nhanh", "hoi hop", "trong nguc", "cardio", "chest pain", "breathless", "palpitation", "heart"],
    fullKeywords: ["đau ngực", "tức ngực", "hồi hộp", "tim đập nhanh", "đánh trống ngực", "khó thở", "tăng huyết áp", "cao huyết áp"],
    description: "Chuyên điều trị các bệnh lý tim mạch, huyết áp, xơ vữa động mạch, suy tim, rối loạn nhịp tim."
  },
  "Nhi khoa": {
    keywords: ["tre", "so sinh", "be", "quay khoc", "bieng an", "soi", "tua luoi", "cham lon", "pediatric", "child", "baby", "infant"],
    fullKeywords: ["trẻ em", "sơ sinh", "quấy khóc", "biếng ăn", "sởi", "tưa lưỡi", "chậm lớn", "sốt ở trẻ", "bé ho"],
    description: "Chuyên chăm sóc sức khỏe toàn diện cho trẻ em từ sơ sinh đến dưới 16 tuổi."
  },
  "Da liễu": {
    keywords: ["da", "ngua", "man do", "mun", "cham", "vay nen", "nam da", "rung toc", "viem da", "seo", "dermatology", "skin", "itchy", "rash", "acne"],
    fullKeywords: ["ngứa da", "nổi mẩn đỏ", "mụn trứng cá", "chàm", "vảy nến", "nấm da", "rụng tóc", "viêm da", "sẹo"],
    description: "Chuyên điều trị các bệnh về da, tóc, móng, dị ứng da và thẩm mỹ da liễu."
  },
  "Thần kinh": {
    keywords: ["dau dau", "chong mat", "mat ngu", "te bi", "co giat", "mat tri nho", "nua dau", "run", "neurology", "headache", "dizzy", "insomnia", "numbness"],
    fullKeywords: ["đau đầu", "chóng mặt", "mất ngủ", "tê bì tay chân", "co giat", "suy giảm trí nhớ", "đau nửa đầu", "đột quỵ nhẹ", "run tay chân"],
    description: "Chuyên khám và điều trị đau đầu, chóng mặt, mất ngủ kinh niên, đau dây thần kinh, tai biến mạch máu não."
  },
  "Tiêu hóa": {
    keywords: ["bung", "day hoi", "kho tieu", "buon non", "tieu chay", "tao bon", "trao nguoc", "o chua", "da day", "gastro", "stomachache", "vomit", "diarrhea", "constipation"],
    fullKeywords: ["đau bụng", "đầy hơi", "khó tiêu", "buồn nôn", "tiêu chảy", "táo bón", "trào ngược dạ dày", "ợ chua", "viêm loét dạ dày"],
    description: "Chuyên điều trị các bệnh về dạ dày, đại tràng, gan mật, tuyến tụy và đường tiêu hóa."
  },
  "Cơ xương khớp": {
    keywords: ["khop", "goi", "xuong", "gay xuong", "trat khop", "dau lung", "vai gay", "loang xuong", "ortho", "joint", "bone", "back pain", "arthritis"],
    fullKeywords: ["đau khớp", "mỏi gối", "thoái hóa khớp", "gãy xương", "trật khớp", "đau lưng", "đau vai gáy", "loãng xương"],
    description: "Chuyên điều trị thoái hóa khớp, thoát vị đĩa đệm, loãng xương, chấn thương xương khớp."
  },
  "Mắt": {
    keywords: ["mat", "moi mat", "chay nuoc mat", "mat mo", "giam thi luc", "ngua mat", "do mat", "can thi", "vien thi", "ophthal", "eye", "blurry", "vision"],
    fullKeywords: ["đau mắt", "mỏi mắt", "chảy nước mắt", "mắt mờ", "giảm thị lực", "ngứa mắt", "đỏ mắt", "cận thị", "viễn thị"],
    description: "Chuyên điều trị tật khúc xạ, viêm kết mạc, đục thủy tinh thể, tăng nhãn áp và các bệnh lý về mắt."
  },
  "Tai Mũi Họng": {
    keywords: ["tai", "mui", "hong", "u tai", "nghet mui", "xoang", "dau hong", "khan tieng", "ho khan", "ent", "ear", "nose", "throat", "sinusitis", "cough"],
    fullKeywords: ["đau tai", "ù tai", "chảy mủ tai", "nghẹt mũi", "viêm xoang", "đau họng", "khản tiếng", "mất khứu giác", "ho khan"],
    description: "Chuyên điều trị viêm tai giữa, ù tai, viêm mũi dị ứng, viêm xoang, viêm họng, viêm amidan."
  }
};

// Hàm loại bỏ dấu tiếng Việt để so sánh chuỗi không dấu
function removeAccents(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Gợi ý chuyên khoa dựa trên nội dung mô tả triệu chứng.
 * @param {string} symptomText - Mô tả các triệu chứng của người bệnh.
 * @returns {Array} Danh sách gợi ý bao gồm điểm số, tên chuyên khoa, mô tả và từ khóa khớp.
 */
export function getSpecialtySuggestion(symptomText) {
  if (!symptomText || symptomText.trim().length < 3) {
    return [
      {
        specialty: "Nội tổng quát",
        score: 1.0,
        confidence: "100%",
        matchedKeywords: [],
        description: "Khoa Nội tổng quát phù hợp để kiểm tra sức khỏe ban đầu khi triệu chứng chưa rõ ràng."
      }
    ];
  }

  const normalizedInput = symptomText.toLowerCase();
  const cleanInput = removeAccents(normalizedInput);
  
  const results = [];
  let totalScore = 0;

  for (const [specialty, data] of Object.entries(specialtyKeywords)) {
    let score = 0;
    const matched = [];

    // Kiểm tra từ khóa có dấu (khớp chính xác cụm từ)
    data.fullKeywords.forEach(kw => {
      if (normalizedInput.includes(kw.toLowerCase())) {
        score += 3; // Trọng số cao hơn cho khớp chính xác cụm từ có dấu
        if (!matched.includes(kw)) matched.push(kw);
      }
    });

    // Kiểm tra từ khóa không dấu
    data.keywords.forEach(kw => {
      // Sử dụng biểu thức chính quy để khớp theo ranh giới từ nếu có thể, hoặc tìm kiếm thường
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (cleanInput.includes(kw)) {
        if (regex.test(cleanInput)) {
          score += 1.5; // Khớp ranh giới từ
        } else {
          score += 0.5; // Khớp chuỗi con
        }
        if (!matched.includes(kw)) matched.push(kw);
      }
    });

    if (score > 0) {
      results.push({
        specialty,
        score,
        matchedKeywords: matched,
        description: data.description
      });
      totalScore += score;
    }
  }

  // Nếu không tìm thấy từ khóa nào trùng khớp, gợi ý chuyên khoa Nội tổng quát
  if (results.length === 0) {
    return [
      {
        specialty: "Nội tổng quát",
        score: 1.0,
        confidence: "100%",
        matchedKeywords: [],
        description: "Khoa khám bệnh chung để định hướng khám lâm sàng ban đầu."
      }
    ];
  }

  // Sắp xếp giảm dần theo điểm số
  results.sort((a, b) => b.score - a.score);

  // Tính toán tỷ lệ phần trăm độ tin cậy
  const formattedResults = results.map(item => {
    const percentage = totalScore > 0 ? Math.round((item.score / totalScore) * 100) : 0;
    return {
      specialty: item.specialty,
      score: item.score,
      confidence: `${percentage}%`,
      matchedKeywords: item.matchedKeywords,
      description: item.description
    };
  });

  return formattedResults;
}
