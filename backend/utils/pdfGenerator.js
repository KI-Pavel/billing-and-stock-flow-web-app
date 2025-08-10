const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

async function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      // Load Unicode font
      const fontPath = path.join(__dirname, "../fonts/NotoSans-Bengali.ttf");
      if (!fs.existsSync(fontPath)) {
        console.error("Font file missing:", fontPath);
        return reject(new Error("Unicode font not found."));
      }
      doc.font(fontPath).fontSize(14);

      // Title
      doc.text("Invoice", { align: "center", underline: true });
      doc.moveDown();

      // Invoice Details
      doc.fontSize(12);
      doc.text(`Invoice ID: ${invoice._id}`);
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleString()}`);
      doc.text(`Customer: ${invoice.customer?.name || "N/A"}`);
      doc.text(`Phone: ${invoice.customer?.phone || "N/A"}`);
      doc.moveDown();

      // Product Details
      doc.text("Product Details:", { underline: true });
      doc.text(`Product: ${invoice.product?.name || "N/A"}`);
      doc.text(`Quantity: ${invoice.quantity || 0}`);
      doc.text(`Price per unit: ৳${invoice.product?.price || 0}`);
      doc.moveDown();

      // Payment Info
      const totalAmount = (invoice.product?.price || 0) * (invoice.quantity || 0);
      doc.text(`Total Amount: ৳${totalAmount.toFixed(2)}`);
      doc.text(`Amount Paid: ৳${invoice.amountPaid.toFixed(2)}`);
      doc.text(`Dues: ৳${invoice.dues.toFixed(2)}`);

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = generateInvoicePDF;
