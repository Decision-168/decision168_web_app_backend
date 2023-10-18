// emailTemplate.js

const generateEmailTemplate = (title, value1, value2) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .email-container {
          background-color: #FFF;
          border:1px solid #E7EBF0;
          border-radius:10px;
          color: #000;
          padding: 16px;
          font-family: Arial, sans-serif;
        }

        .header {
          font-size: 24px;
          margin-bottom: 20px;
        }
        .description {
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <h1 class="header">Decision168</h1>
        <p class="title">${title}</p>
        <ul class="description">
          <li>${value1}</li>
        ${value2 !== null && value2 !== undefined ? `<li>${value2}</li>` : ""}
        </ul>
        <br/>
        <br/>
         <p class="title">Best regards,</p>
           <p class="title">The Decision168 Team,</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = generateEmailTemplate;
