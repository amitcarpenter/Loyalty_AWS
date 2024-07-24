const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you have your OpenAI API key set in your environment variables
});
const openai = new OpenAIApi(configuration);

const analyzeData = async (dataForAnalysis) => {
  try {
    const prompt = `
    Analyze the following data and provide insights:
    ${JSON.stringify(dataForAnalysis)}
    `;

    const response = await openai.createCompletion({
      model: "text-davinci-003", // Or any other model you want to use
      prompt: prompt,
      max_tokens: 1500, // Adjust the token count based on your requirement
      temperature: 0.5, // Adjust the temperature to control the randomness of the output
    });

    const analysisResult = response.data.choices[0].text.trim();
    return analysisResult;
  } catch (error) {
    console.error("Error during data analysis:", error);
    throw new Error("Data analysis failed");
  }
};

module.exports = { analyzeData };
