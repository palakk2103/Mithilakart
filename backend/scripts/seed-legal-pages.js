require('dotenv').config();
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const LegalPage = require('../src/models/LegalPage');
const { LEGAL_PAGE_TYPES } = require('../src/constants/catalog');

const richLegalPages = [
  {
    type: LEGAL_PAGE_TYPES.TERMS,
    title: 'Terms of Use',
    content: `<h2>1. Introduction</h2>
<p>Welcome to Mithilakart! These Terms of Use ("Terms") govern your access to and use of the Mithilakart platform, including our website, mobile applications, and services (collectively, the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms.</p>

<h2>2. Eligibility</h2>
<p>To use Mithilakart, you must:</p>
<ul>
  <li>Be at least 18 years of age</li>
  <li>Have the legal capacity to enter into binding contracts</li>
  <li>Provide accurate and complete registration information</li>
  <li>Maintain the security of your account credentials</li>
</ul>

<h2>3. Account Registration</h2>
<p>You may be required to create an account to access certain features. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>

<h2>4. Use of Platform</h2>
<p>You agree to use the Platform only for lawful purposes. You must not:</p>
<ul>
  <li>Violate any applicable laws or regulations</li>
  <li>Infringe upon the rights of others</li>
  <li>Transmit harmful or malicious code</li>
  <li>Attempt to gain unauthorized access to our systems</li>
  <li>Use the Platform for fraudulent purposes</li>
  <li>Harass, abuse, or harm other users</li>
</ul>

<h2>5. Products and Services</h2>
<p>All products and services offered on Mithilakart are subject to availability. We reserve the right to limit quantities, discontinue products, or refuse service at our discretion. Prices are subject to change without notice. Product descriptions and images are provided for convenience and may not be entirely accurate.</p>

<h2>6. Orders and Payments</h2>
<p>By placing an order, you make an offer to purchase products at the listed price. We reserve the right to accept or reject your order. Payment must be made through our approved payment methods. All transactions are processed securely, and we do not store your complete payment information.</p>

<h2>7. Shipping and Delivery</h2>
<p>Delivery times are estimates and may vary. We are not responsible for delays caused by third-party carriers or circumstances beyond our control. Risk of loss passes to you upon delivery to the carrier.</p>

<h2>8. Returns and Refunds</h2>
<p>Our return policy allows returns within 10 days of delivery for eligible products. Items must be unused, in original packaging, and in resalable condition. Refunds will be processed to the original payment method within 7-10 business days after we receive the returned item.</p>

<h2>9. Intellectual Property</h2>
<p>All content on the Platform, including text, graphics, logos, images, and software, is the property of Mithilakart or its licensors and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>

<h2>10. Limitation of Liability</h2>
<p>To the maximum extent permitted by law, Mithilakart shall not be liable for any indirect, incidental, special, exemplary, or consequential damages arising out of or related to your use of the Platform.</p>

<h2>11. Modifications to Terms</h2>
<p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Platform after changes are posted constitutes acceptance of the modified Terms.</p>

<h2>12. Governing Law</h2>
<p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, India.</p>

<h2>13. Contact Us</h2>
<p>If you have any questions about these Terms, please contact us at:</p>
<p><strong>Email:</strong> support@mithilakart.com<br/><strong>Phone:</strong> +91 1800-123-4567<br/><strong>Address:</strong> Mithilakart Pvt Ltd, Mumbai, India</p>`,
  },
  {
    type: LEGAL_PAGE_TYPES.PRIVACY,
    title: 'Privacy Policy',
    content: `<h2>1. Introduction</h2>
<p>At Mithilakart, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform. Please read this policy carefully.</p>

<h2>2. Information We Collect</h2>
<h3>2.1 Personal Information</h3>
<p>We collect information that you provide directly to us, including:</p>
<ul>
  <li>Name, email address, and phone number</li>
  <li>Shipping and billing addresses</li>
  <li>Payment information (processed securely by third-party providers)</li>
  <li>Account credentials</li>
  <li>Purchase history and preferences</li>
</ul>

<h3>2.2 Automatically Collected Information</h3>
<p>When you use our Platform, we automatically collect:</p>
<ul>
  <li>Device information (IP address, browser type, operating system)</li>
  <li>Usage data (pages viewed, time spent, click patterns)</li>
  <li>Location information (with your permission)</li>
  <li>Cookies and similar tracking technologies</li>
</ul>

<h2>3. How We Use Your Information</h2>
<p>We use your information for the following purposes:</p>
<ul>
  <li>Process and fulfill your orders</li>
  <li>Communicate with you about your account and orders</li>
  <li>Provide customer support</li>
  <li>Personalize your shopping experience</li>
  <li>Send promotional offers and updates (with your consent)</li>
  <li>Improve our Platform and services</li>
  <li>Detect and prevent fraud and security threats</li>
  <li>Comply with legal obligations</li>
</ul>

<h2>4. Information Sharing and Disclosure</h2>
<p>We may share your information with:</p>
<ul>
  <li><strong>Service Providers:</strong> Third parties who perform services on our behalf (payment processing, shipping, analytics)</li>
  <li><strong>Business Partners:</strong> Sellers and vendors whose products you purchase</li>
  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
</ul>
<p>We do not sell your personal information to third parties for their marketing purposes.</p>

<h2>5. Data Security</h2>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>

<h2>6. Your Rights and Choices</h2>
<p>You have the right to access and update your personal information, request deletion of your account and data, opt-out of marketing communications, or request a copy of your data.</p>

<h2>7. Contact Us</h2>
<p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:</p>
<p><strong>Email:</strong> privacy@mithilakart.com<br/><strong>Phone:</strong> +91 1800-123-4567<br/><strong>Address:</strong> Mithilakart Pvt Ltd, Data Protection Officer, Mumbai, India</p>`,
  },
  {
    type: LEGAL_PAGE_TYPES.SHIPPING,
    title: 'Shipping Policy',
    content: `<h2>1. Shipping Coverage</h2>
<p>At Mithilakart, we deliver to over <strong>20,000+ pincodes</strong> across India. Enter your pincode on the product page or during checkout to check if delivery is available in your area.</p>
<ul>
  <li>All major cities and metro areas</li>
  <li>Tier 2 and Tier 3 cities</li>
  <li>Most rural and remote locations across all states and Union Territories</li>
</ul>

<h2>2. Delivery Timeline</h2>
<p>Estimated delivery timelines based on location:</p>
<ul>
  <li><strong>Standard Delivery (Metro Cities):</strong> 2-4 business days</li>
  <li><strong>Standard Delivery (Other Cities):</strong> 4-7 business days</li>
  <li><strong>Quick Delivery (Select Cities):</strong> 1-2 business days (subject to availability)</li>
  <li><strong>Remote Locations:</strong> 7-10 business days</li>
</ul>
<p><em>Note: Delivery timelines are estimates and may vary due to weather conditions, festivals, strikes, or regional public holidays. We will keep you updated via SMS and WhatsApp.</em></p>

<h2>3. Shipping Charges</h2>
<ul>
  <li><strong>FREE Shipping:</strong> On all orders above ₹499 and for Mithilakart Plus members on all eligible orders.</li>
  <li><strong>Standard Shipping:</strong> ₹40 flat fee for orders below ₹499.</li>
  <li><strong>Bulky/Heavy Items:</strong> ₹80-150 based on weight and volume.</li>
  <li><strong>Remote Area Surcharge:</strong> ₹50 where applicable.</li>
</ul>

<h2>4. Order Processing and Tracking</h2>
<p>Orders are typically processed within 24-48 hours of placement. You will receive real-time order tracking details via SMS, WhatsApp, and email once your package is dispatched. You can also track your orders live in the "My Orders" section of your profile.</p>

<h2>5. Contact Shipping Support</h2>
<p>If you experience any delay or issue with delivery, contact our shipping desk:</p>
<p><strong>Email:</strong> shipping@mithilakart.com<br/><strong>Phone:</strong> +91 1800-123-4567<br/><strong>Hours:</strong> Mon - Sat: 9:00 AM - 6:00 PM</p>`,
  },
  {
    type: LEGAL_PAGE_TYPES.CANCELLATION,
    title: 'Cancellation & Returns',
    content: `<h2>1. Order Cancellation Policy</h2>
<p>You can cancel your order anytime before it has been dispatched/shipped from our warehouse or vendor hub.</p>
<ul>
  <li><strong>How to Cancel:</strong> Navigate to "My Orders", select the order, tap "Cancel Order", provide a cancellation reason, and confirm.</li>
  <li><strong>Refund Timeline:</strong> Prepaid orders cancelled prior to dispatch will be automatically refunded to the original payment source within 3-5 business days. For Cash on Delivery orders, no charges apply.</li>
</ul>

<h2>2. Return Policy</h2>
<p>We provide a <strong>10-day return window</strong> from the date of package delivery for all eligible products.</p>

<h3>2.1 Eligible Items for Return:</h3>
<ul>
  <li>Defective, damaged, or broken products</li>
  <li>Wrong item or size delivered</li>
  <li>Items noticeably different from product description</li>
  <li>Unused items in original packaging with intact tags, invoices, and labels</li>
</ul>

<h3>2.2 Non-Returnable Items:</h3>
<ul>
  <li>Personal care, cosmetics, and grooming products</li>
  <li>Innerwear and intimate garments</li>
  <li>Perishable items and food items</li>
  <li>Customized and handmade personalized craft items</li>
</ul>

<h2>3. Step-by-Step Return Process</h2>
<ol>
  <li><strong>Initiate Return:</strong> Go to "My Orders" in your profile, find your item, and tap "Return".</li>
  <li><strong>Select Reason:</strong> Choose the issue and attach a photo if the product was damaged or incorrect.</li>
  <li><strong>Doorstep Pickup:</strong> Our courier representative will pick up the package from your delivery address within 2-4 business days.</li>
  <li><strong>Quality Check:</strong> The item undergoes a basic condition check at our hub.</li>
  <li><strong>Refund:</strong> Refund is initiated immediately upon verification.</li>
</ol>

<h2>4. Refund Methods and Timelines</h2>
<ul>
  <li><strong>UPI / Net Banking / Cards:</strong> Credited within 5-7 business days.</li>
  <li><strong>Mithilakart Wallet:</strong> Instant credit upon return approval.</li>
  <li><strong>Cash on Delivery (COD):</strong> Bank transfer (NEFT/IMPS) once you provide your UPI ID or account number.</li>
</ul>

<h2>5. Need Help?</h2>
<p>For urgent return or cancellation assistance:</p>
<p><strong>Email:</strong> returns@mithilakart.com<br/><strong>Support Hotline:</strong> +91 1800-123-4567 (Mon-Sat, 9 AM - 6 PM)</p>`,
  },
];

async function seed() {
  await connectDatabase();
  for (const page of richLegalPages) {
    await LegalPage.findOneAndUpdate(
      { type: page.type },
      {
        type: page.type,
        title: page.title,
        content: page.content,
      },
      { upsert: true, new: true }
    );
    console.log(`Updated legal page: ${page.type} - ${page.title}`);
  }
  await disconnectDatabase();
  console.log('Finished seeding rich legal pages successfully.');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
