const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search using Google Generative AI")
    .addStringOption(option =>
      option
        .setName("query")
        .setDescription("The search term or question")
        .setRequired(true)
    ),
  
  async execute(interaction) {
    await interaction.deferReply(); // Defer the reply to avoid timeout

    try {
      const query = interaction.options.getString("query")+"summarize it not more than 199 words";

      const requestBody = {
        contents: [{ parts: [{ text: query }] }]
      };

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
        requestBody,
        {
          params: {
            key: process.env.API_KEY
          },
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
        const generatedText = response.data.candidates[0].content.parts[0].text;
        
        // Create an embed for a nicer looking response
        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle('Search Results')
          .setDescription(generatedText.slice(0, 4096)) // Discord has a 4096 character limit for embed descriptions
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        throw new Error('Unexpected response structure from API');
      }

    } catch (error) {
      console.error("Error executing the search command", error);
      
      let errorMessage = "Something went wrong while processing your request.";
      
      if (error.response) {
        console.error("Error details:", error.response.data);
        if (error.response.status === 401) {
          errorMessage = "There was an authentication error. Please check the API key.";
        } else if (error.response.status === 400) {
          errorMessage = "There was an error with the request. Please try a different query.";
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage = "No response received from the API. Please try again later.";
      } else {
        console.error("Error details:", error.message);
      }

      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription(errorMessage)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};