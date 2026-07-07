const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Workspace = require('../src/models/Workspace');
const Product = require('../src/models/Product');

const products = [
  ['Phone', 'phone', '/phone.webp', 89900, '', 'Mobiles'],
  ['Audio', 'audio', '/audio.webp', 14900, '50%', 'Audio'],
  ['Laptop', 'laptop', '/laptop.webp', 129900, '', 'Laptops'],
  ['Camera', 'camera', '/camera.webp', 7900, '', 'Cameras'],
  ['Television', 'television', '/television.webp', 59900, '', 'Televisions'],
  ['Tablet', 'tablet', '/tablet.webp', 39900, '', 'Tablets'],
  ['Watch', 'watch', '/watch.webp', 19900, '', 'Wearables'],
  ['Speaker', 'speaker', '/speaker.webp', 8900, '', 'Audio'],
  ['Keyboard', 'keyboard', '/keyboard.webp', 4900, '', 'Accessories'],
  ['Mouse', 'mouse', '/mouse.webp', 2900, '', 'Accessories'],
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);

  const seedEmail = process.env.SEED_STORE_USER_EMAIL || process.env.SMTP_USER;
  const user = seedEmail
    ? await User.findOne({ email: seedEmail.toLowerCase() })
    : await User.findOne().sort({ createdAt: 1 });
  if (!user) throw new Error('Create a user first or set SEED_STORE_USER_EMAIL');

  let workspace = process.env.ECOMMERCE_WORKSPACE_ID
    ? await Workspace.findOne({ _id: process.env.ECOMMERCE_WORKSPACE_ID, userId: user._id })
    : null;
  if (!workspace) {
    workspace = await Workspace.findOne({ userId: user._id, projectName: 'Stackly Demo Store' });
  }
  if (!workspace) {
    workspace = await Workspace.create({
      userId: user._id,
      projectName: 'Stackly Demo Store',
      category: 'store',
      style: 'Modern',
      description: 'DB-backed demo storefront for Stackly checkout.',
    });
  }

  for (const [name, slug, image, price, badge, category] of products) {
    await Product.findOneAndUpdate(
      { workspaceId: workspace._id, slug },
      {
        $set: {
          userId: user._id,
          name,
          description: `${name} from the Stackly demo storefront.`,
          price,
          salePrice: null,
          currency: 'INR',
          images: [image],
          category,
          inventory: 100,
          status: 'active',
          sku: `DEMO-${slug.toUpperCase()}`,
          variants: [],
          options: [],
          badge,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Store workspace: ${workspace._id}`);
  console.log(`Seeded ${products.length} products.`);
  console.log(`Set ECOMMERCE_WORKSPACE_ID=${workspace._id} in backend/.env`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
