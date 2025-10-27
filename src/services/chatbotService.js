const axios = require('axios');
const jobService = require('./jobService');

/**
 * Classify intent của user message
 * @param {string} message - Tin nhắn từ user
 * @returns {string} - Intent type: search_job, chat, cv_advice, career_advice, general_help
 */
const classifyIntent = (message) => {
  const lowerMessage = message.toLowerCase();

  // Keywords for CV advice
  const cvKeywords = ['cv', 'resume', 'sơ yếu', 'hồ sơ', 'đơn xin việc', 'chuẩn bị', 'nộp', 'ứng tuyển'];
  
  // Keywords for career advice
  const careerKeywords = ['định hướng', 'phát triển', 'sự nghiệp', 'bắt đầu', 'nghề nghiệp', 'tương lai', 'hướng đi'];
  
  // Keywords for job search
  const jobSearchKeywords = ['tìm việc', 'việc làm', 'công việc', 'tuyển dụng', 'job', 'position', 'vacancy'];
  
  // Keywords for general chat
  const chatKeywords = ['xin chào', 'hello', 'hi', 'cảm ơn', 'thanks', 'cám ơn', 'tạm biệt', 'bye'];
  
  // Check for CV advice
  if (cvKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'cv_advice';
  }
  
  // Check for career advice
  if (careerKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'career_advice';
  }
  
  // Check for job search
  if (jobSearchKeywords.some(kw => lowerMessage.includes(kw)) || 
      parseUserMessage(message).keyword || 
      parseUserMessage(message).location) {
    return 'search_job';
  }
  
  // Check for general chat
  if (chatKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'chat';
  }
  
  // Default to search_job if there's any technical keyword or location
  const parsed = parseUserMessage(message);
  if (parsed.keyword || parsed.location || parsed.salary_min) {
    return 'search_job';
  }
  
  // Default to general chat
  return 'chat';
};

/**
 * Parse user message để extract các thông tin tìm kiếm
 * @param {string} message - Tin nhắn từ user
 * @returns {object} - Object chứa các thông tin parsed
 */
const parseUserMessage = (message) => {
  console.log('[PARSE] Starting to parse message:', message);
  
  const result = {
    keyword: null,
    location: null,
    salary_min: null,
    salary_max: null,
    jobType: null,
    category: null,
    experienceLevel: null
  };

  const lowerMessage = message.toLowerCase();
  console.log('[PARSE] Lowercase message:', lowerMessage);

  // Extract keyword (các công nghệ phổ biến)
  const techKeywords = [
    'java', 'python', 'javascript', 'react', 'vue', 'angular', 'nodejs', 'node.js',
    'php', 'laravel', 'java spring', 'spring boot', 'nestjs', 'express', 'mongodb',
    'mysql', 'postgresql', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'frontend', 'backend', 'fullstack', 'full-stack', 'devops', '.net', 'c#',
    'flutter', 'react native', 'ios', 'android', 'swift', 'kotlin', 'go', 'golang',
    'ruby', 'rails', 'html', 'css', 'scss', 'sass', 'tailwind', 'bootstrap',
    'typescript', 'graphql', 'rest api', 'microservice',
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'data science', 'data analyst', 'business analyst', 'product manager'
  ];

  // Extract multiple keywords (không break ngay)
  const foundKeywords = [];
  for (const keyword of techKeywords) {
    if (lowerMessage.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }
  
  // Lấy keyword dài nhất để tránh match "ai" khi user nói "tailwind"
  if (foundKeywords.length > 0) {
    result.keyword = foundKeywords.reduce((a, b) => a.length > b.length ? a : b);
  }

  // Extract location (check longer location names first)
  const locations = [
    ['tp hồ chí minh', 'TP.HCM'],
    ['tp. hồ chí minh', 'TP.HCM'],
    ['hồ chí minh', 'TP.HCM'],
    ['ho chi minh', 'TP.HCM'],
    ['tp.hcm', 'TP.HCM'],
    ['hcm', 'TP.HCM'],
    ['hà nội', 'Hà Nội'],
    ['hanoi', 'Hà Nội'],
    ['tp hà nội', 'Hà Nội'],
    ['đà nẵng', 'Đà Nẵng'],
    ['da nang', 'Đà Nẵng'],
    ['hải phòng', 'Hải Phòng'],
    ['hai phong', 'Hải Phòng'],
    ['cần thơ', 'Cần Thơ'],
    ['can tho', 'Cần Thơ'],
    ['nghệ an', 'Nghệ An'],
    ['nghe an', 'Nghệ An'],
    ['bình dương', 'Bình Dương'],
    ['binh duong', 'Bình Dương'],
    ['đồng nai', 'Đồng Nai'],
    ['dong nai', 'Đồng Nai']
  ];

  for (const [alias, standardized] of locations) {
    if (lowerMessage.includes(alias)) {
      result.location = standardized;
      console.log('[PARSE] Found location:', standardized);
      break;
    }
  }

  // Extract salary
  const salaryRegex = /(\d+)\s*(?:triệu|million|triệu vnd)?/g;
  const salaryMatches = lowerMessage.match(salaryRegex);
  if (salaryMatches) {
    salaryMatches.forEach(match => {
      const num = parseInt(match.replace(/[^\d]/g, ''));
      if (!result.salary_min) {
        result.salary_min = num * 1000000; // Convert to VND
      } else if (!result.salary_max) {
        result.salary_max = num * 1000000;
      }
    });
  }

  // Extract jobType
  const jobTypes = {
    'toàn thời gian': 'full-time',
    'full-time': 'full-time',
    'fulltime': 'full-time',
    'part-time': 'part-time',
    'parttime': 'part-time',
    'bán thời gian': 'part-time',
    'remote': 'remote',
    'làm việc từ xa': 'remote',
    'wfh': 'remote',
    'hợp đồng': 'contract',
    'contract': 'contract',
    'thực tập': 'internship',
    'internship': 'internship',
    'intern': 'internship'
  };

  for (const [key, value] of Object.entries(jobTypes)) {
    if (lowerMessage.includes(key)) {
      result.jobType = value;
      break;
    }
  }

  // Extract category
  const categories = {
    'it': 'IT',
    'marketing': 'Marketing',
    'finance': 'Finance',
    'tài chính': 'Finance',
    'sales': 'Sales',
    'bán hàng': 'Sales',
    'engineering': 'Engineering',
    'design': 'Design',
    'thiết kế': 'Design',
    'hr': 'HR',
    'nhân sự': 'HR'
  };

  for (const [key, value] of Object.entries(categories)) {
    if (lowerMessage.includes(key)) {
      result.category = value;
      break;
    }
  }

  // Extract experience level
  const experienceLevels = {
    'intern': 'intern',
    'thực tập sinh': 'intern',
    'fresher': 'fresher',
    'mới tốt nghiệp': 'fresher',
    'junior': 'junior',
    'mid-level': 'mid-level',
    'midlevel': 'mid-level',
    'trung cấp': 'mid-level',
    'senior': 'senior',
    'cao cấp': 'senior'
  };

  for (const [key, value] of Object.entries(experienceLevels)) {
    if (lowerMessage.includes(key)) {
      result.experienceLevel = value;
      break;
    }
  }

  console.log('[PARSE] Final parsed result:', JSON.stringify(result, null, 2));
  return result;
};

/**
 * Build prompt cho OpenRouter
 * @param {string} userMessage - Tin nhắn từ user
 * @param {string} intent - Intent type
 * @param {array} jobs - Danh sách jobs (optional)
 * @param {object} parsedParams - Các thông số đã parse (optional)
 * @returns {string} - Prompt đầy đủ
 */
const buildPrompt = (userMessage, intent, jobs = [], parsedParams = {}) => {
  if (intent === 'search_job' && jobs.length > 0) {
    const jobsInfo = jobs.slice(0, 5).map((job, index) => {
      return `
${index + 1}. ${job.title}
   Công ty: ${job.company.name}
   Địa điểm: ${job.location}
   Lương: ${(job.salary.min / 1000000).toFixed(1)}-${(job.salary.max / 1000000).toFixed(1)} triệu VND
   Loại: ${job.jobType}
   Kinh nghiệm: ${job.experienceLevel}`;
    }).join('\n');

    return `Bạn là trợ lý tuyển dụng chuyên nghiệp. Người dùng hỏi:
"${userMessage}"

Thông tin tìm kiếm đã được xác định:
- Từ khóa: ${parsedParams.keyword || 'Không xác định'}
- Địa điểm: ${parsedParams.location || 'Không xác định'}
- Lương tối thiểu: ${parsedParams.salary_min ? (parsedParams.salary_min / 1000000).toFixed(1) + ' triệu' : 'Không xác định'}

Dưới đây là các công việc phù hợp:
${jobsInfo}

Hãy viết câu trả lời tự nhiên, thân thiện bằng tiếng Việt, khoảng 2-3 câu. Hãy giới thiệu các công việc phù hợp một cách tích cực và mời người dùng xem chi tiết.`;
  } else if (intent === 'cv_advice') {
    return `Bạn là chuyên gia tư vấn nghề nghiệp có nhiều kinh nghiệm về viết CV. Người dùng đang hỏi:
"${userMessage}"

Hãy đưa ra lời khuyên CHI TIẾT và ĐẦY ĐỦ về:
1. Các nguyên tắc cơ bản khi viết CV (ngắn gọn, súc tích, tập trung)
2. Cấu trúc CV chuyên nghiệp (thông tin cá nhân, mục tiêu nghề nghiệp, kinh nghiệm, kỹ năng, học vấn)
3. Các tips để CV nổi bật (sử dụng số liệu cụ thể, action verbs, keywords, design)
4. Những lỗi cần tránh khi viết CV
5. Cách tùy chỉnh CV cho từng vị trí

Trả lời bằng tiếng Việt, sử dụng format markdown với **bold**, *italic*, danh sách số và danh sách gạch đầu dòng để dễ đọc. Hãy đưa ra ví dụ cụ thể và lời khuyên thực tế. Độ dài trả lời nên là khoảng 300-500 từ để đảm bảo đầy đủ thông tin.`;
  } else if (intent === 'career_advice') {
    return `Bạn là chuyên gia tư vấn nghề nghiệp. Người dùng đang hỏi về phát triển sự nghiệp:
"${userMessage}"

Hãy đưa ra lời khuyên hữu ích về định hướng nghề nghiệp, kỹ năng cần thiết, và cách phát triển sự nghiệp. Trả lời bằng tiếng Việt, thân thiện và tích cực.`;
  } else if (intent === 'chat') {
    return `Bạn là trợ lý tuyển dụng thân thiện. Người dùng nói:
"${userMessage}"

Hãy trả lời một cách tự nhiên, thân thiện bằng tiếng Việt. Bạn có thể giúp họ:
- Tìm việc làm phù hợp
- Tư vấn về CV và nghề nghiệp
- Trả lời các câu hỏi về quy trình ứng tuyển

Hãy làm người bạn, trò chuyện tự nhiên và hỏi bạn có thể giúp gì không.`;
  } else if (intent === 'search_job' && jobs.length === 0) {
    return `Bạn là trợ lý tuyển dụng. Người dùng đang tìm kiếm: "${userMessage}"

Hiện tại không có công việc nào phù hợp với yêu cầu của bạn. Hãy trả lời lịch sự, xin lỗi vì không tìm thấy kết quả, và đề nghị người dùng:
1. Thử tìm kiếm với từ khóa khác
2. Bỏ qua một số điều kiện
3. Cho biết bạn có thể tư vấn thêm về CV hoặc nghề nghiệp

Trả lời bằng tiếng Việt, thân thiện.`;
  } else {
    // General help
    return `Bạn là trợ lý tuyển dụng AI. Người dùng hỏi: "${userMessage}"

Hãy trả lời một cách hữu ích, thân thiện bằng tiếng Việt. Bạn có thể giúp người dùng:
1. Tìm việc làm phù hợp
2. Tư vấn về CV và cover letter
3. Định hướng nghề nghiệp
4. Cải thiện kỹ năng phỏng vấn

Hãy trả lời câu hỏi của họ và hỏi xem còn cần giúp gì thêm không.`;
  }
};

/**
 * Call OpenRouter API để lấy AI response
 * @returns {string} - Response từ AI
 */
const callOpenRouter = async (prompt, stream = false) => {
  try {
    console.log('[OPENROUTER] Calling API...', stream ? '(with streaming)' : '(without streaming)');
    
    const config = {
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      data: {
        model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-1b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: stream
      },
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: stream ? 'stream' : 'json'
    };

    const response = await axios(config);
    
    if (stream) {
      // Return stream for streaming handler
      return response;
    } else {
      // Return content for non-streaming handler
      const content = response.data.choices[0].message.content;
      console.log('[OPENROUTER] Response received, length:', content.length);
      
      // Kiểm tra nếu response trống
      if (!content || content.trim().length === 0) {
        console.log('[OPENROUTER] WARNING: Empty response from AI!');
        return 'Xin lỗi, tôi gặp vấn đề kỹ thuật. Vui lòng thử lại sau.';
      }

      return content;
    }
  } catch (error) {
    console.error('[OPENROUTER] Error calling OpenRouter:', error.message);
    if (error.response) {
      console.error('[OPENROUTER] Response data:', error.response.data);
    }
    throw new Error('Không thể kết nối đến dịch vụ AI. Vui lòng thử lại sau.');
  }
};

/**
 * Main function để handle message
 * @param {string} userMessage - Tin nhắn từ user
 * @returns {object} - {success, message, jobs}
 */
const handleMessage = async (userMessage) => {
  try {
    console.log('[CHATBOT] === START MESSAGE HANDLING ===');
    console.log('[CHATBOT] User message:', userMessage);

    // Classify intent
    const intent = classifyIntent(userMessage);
    console.log('[CHATBOT] Classified intent:', intent);

    let parsedParams = {};
    let jobs = [];

    // Chỉ tìm kiếm jobs nếu intent là search_job
    if (intent === 'search_job') {
      console.log('[CHATBOT] Intent is search_job, parsing message...');
      
      // Parse user message
      parsedParams = parseUserMessage(userMessage);
      console.log('[CHATBOT] Parsed params:', JSON.stringify(parsedParams, null, 2));

      // Search jobs với params đã parse
      console.log('[CHATBOT] Searching jobs with params:', {
        keyword: parsedParams.keyword,
        location: parsedParams.location,
        jobType: parsedParams.jobType,
        experienceLevel: parsedParams.experienceLevel,
        category: parsedParams.category,
        status: 'active'
      });
      
      const allJobs = await jobService.searchJobs({
        keyword: parsedParams.keyword,
        location: parsedParams.location,
        jobType: parsedParams.jobType,
        experienceLevel: parsedParams.experienceLevel,
        category: parsedParams.category,
        status: 'active'
      });

      console.log('[CHATBOT] Found', allJobs.length, 'jobs from search');

      // Giới hạn 5 jobs
      jobs = allJobs.slice(0, 5);
      console.log('[CHATBOT] Limiting to', jobs.length, 'jobs');
    }

    // Build prompt dựa trên intent
    console.log('[CHATBOT] Building prompt...');
    const prompt = buildPrompt(userMessage, intent, jobs, parsedParams);
    console.log('[CHATBOT] Prompt length:', prompt.length, 'characters');
    
    // Call OpenRouter
    console.log('[CHATBOT] Calling OpenRouter API...');
    const aiResponse = await callOpenRouter(prompt);
    console.log('[CHATBOT] AI response length:', aiResponse.length, 'characters');
    console.log('[CHATBOT] AI response (first 100 chars):', aiResponse.substring(0, 100));

    // Format jobs để trả về
    const formattedJobs = jobs.map(job => ({
      _id: job._id,
      title: job.title,
      company: {
        name: job.company.name,
        avatarUrl: job.company.avatarUrl
      },
      location: job.location,
      salary: job.salary,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      category: job.category
    }));

    console.log('[CHATBOT] Returning', formattedJobs.length, 'formatted jobs');
    console.log('[CHATBOT] === END MESSAGE HANDLING ===');

    return {
      success: true,
      message: aiResponse,
      jobs: formattedJobs
    };
  } catch (error) {
    console.error('[CHATBOT] Error in chatbot service:', error);
    throw error;
  }
};

module.exports = {
  classifyIntent,
  parseUserMessage,
  buildPrompt,
  callOpenRouter,
  handleMessage
};

