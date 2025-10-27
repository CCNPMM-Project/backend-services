const chatbotService = require('../services/chatbotService');

/**
 * Handle message from user
 */
const handleMessage = async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tin nhắn không được để trống!'
      });
    }

    // Truncate message if too long (max 1000 characters)
    const truncatedMessage = message.trim().substring(0, 1000);

    // Call chatbot service
    const result = await chatbotService.handleMessage(truncatedMessage);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in chatbot controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Có lỗi xảy ra khi xử lý tin nhắn. Vui lòng thử lại sau.'
    });
  }
};

/**
 * Handle streaming message from user
 */
const handleStreamingMessage = async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tin nhắn không được để trống!'
      });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Truncate message if too long (max 1000 characters)
    const truncatedMessage = message.trim().substring(0, 1000);

    // Get intent and parse
    const intent = chatbotService.classifyIntent(truncatedMessage);
    let parsedParams = {};
    let jobs = [];

    if (intent === 'search_job') {
      parsedParams = chatbotService.parseUserMessage(truncatedMessage);
      const allJobs = await require('../services/jobService').searchJobs({
        keyword: parsedParams.keyword,
        location: parsedParams.location,
        jobType: parsedParams.jobType,
        experienceLevel: parsedParams.experienceLevel,
        category: parsedParams.category,
        status: 'active'
      });
      jobs = allJobs.slice(0, 5);
    }

    // Build prompt
    const prompt = chatbotService.buildPrompt(truncatedMessage, intent, jobs, parsedParams);

    // Call OpenRouter with streaming
    const stream = await chatbotService.callOpenRouter(prompt, true);
    
    let fullText = '';
    let buffer = '';

    stream.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            // Send jobs at the end
            res.write(`data: ${JSON.stringify({ type: 'done', jobs: jobs })}\n\n`);
            res.end();
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
              const content = parsed.choices[0].delta.content;
              fullText += content;
              res.write(`data: ${JSON.stringify({ type: 'chunk', content: content })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    });

    stream.data.on('end', () => {
      res.write(`data: ${JSON.stringify({ type: 'done', jobs: jobs })}\n\n`);
      res.end();
    });

    stream.data.on('error', (error) => {
      console.error('[STREAM] Error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Lỗi streaming' })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Error in streaming chatbot controller:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
};

module.exports = {
  handleMessage,
  handleStreamingMessage
};


