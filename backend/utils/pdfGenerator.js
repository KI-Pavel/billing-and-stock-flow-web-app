const PDFDocument = require('pdfkit');

function generateInvoicePDF(invoice) {
  const doc = new PDFDocument({ size: 'A4' });
  let buffers = [];

  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  // Header
  doc.fontSize(20).text('Invoice', { align: 'center' });
  doc.moveDown();

  // Invoice info
  doc.fontSize(12).text(`Invoice ID: ${invoice._id}`);
  doc.text(`Date: ${invoice.date ? new Date(invoice.date).toLocaleDateString() : ''}`);
  doc.text(`Customer Phone: ${invoice.customer ? invoice.customer.phone : 'N/A'}`);
  doc.text(`Seller ID: ${invoice.seller ? (invoice.seller._id || invoice.seller.toString()) : 'N/A'}`);
  doc.moveDown();

  // Product and payment details
  doc.text(`Product: ${invoice.product ? invoice.product.name : 'N/A'}`);
  doc.text(`Quantity: ${invoice.quantity || 0}`);
  doc.text(`Amount Paid: ৳${invoice.amountPaid || 0}`);
  doc.text(`Dues: ৳${invoice.dues || 0}`);

  doc.moveDown();
  doc.text('Thank you!', { align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);
  });
}

module.exports = generateInvoicePDF;