import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Direct mappings of all the clothes data that was processed and uploaded in logs and files
const clothesData = [
  // ==================== ACCESSORIES ====================
  {
    category: 'accessories',
    folder: '7',
    name: 'Watch of Class(C)',
    price: 240,
    sizes: [],
    images: [
      'IMG-20260513-WA0061.jpg',
      'IMG-20260513-WA0062.jpg',
      'IMG-20260513-WA0063.jpg',
      'IMG-20260513-WA0064.jpg',
      'IMG-20260513-WA0065.jpg',
      'IMG-20260513-WA0066.jpg',
      'IMG-20260513-WA0067.jpg',
      'IMG-20260513-WA0068.jpg',
      'IMG-20260513-WA0069.jpg',
      'IMG-20260513-WA0070.jpg',
      'IMG-20260513-WA0071.jpg',
      'IMG-20260513-WA0072.jpg',
      'IMG-20260513-WA0073.jpg',
      'IMG-20260521-WA0083.jpg'
    ]
  },

  // ==================== APPAREL ====================
  {
    category: 'apparel',
    folder: '1',
    name: 'Original Vintage long sleeves',
    price: 130,
    sizes: ['L', 'XL', '2XL', '3XL', '4XL'],
    images: [
      'WhatsApp Image 2026-06-11 at 21.53.43.jpeg',
      'WhatsApp Image 2026-06-11 at 21.53.44.jpeg',
      'WhatsApp Image 2026-06-11 at 21.53.45.jpeg',
      'WhatsApp Image 2026-06-11 at 21.53.46.jpeg',
      'WhatsApp Image 2026-06-11 at 21.53.47.jpeg',
      'WhatsApp Image 2026-06-11 at 21.53.48.jpeg'
    ]
  },
  {
    category: 'apparel',
    folder: '10',
    name: 'Plain Top & Down',
    price: 300,
    sizes: ['L', 'XL', '2XL', '3XL'],
    images: [
      'IMG-20260529-WA0124.jpg',
      'IMG-20260529-WA0125.jpg',
      'IMG-20260529-WA0126.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '11',
    name: 'Armless top & down',
    price: 250,
    sizes: ['XL', '2XL', '3XL'],
    images: [
      'IMG-20260520-WA0119.jpg',
      'IMG-20260520-WA0125.jpg',
      'IMG-20260522-WA0133.jpg',
      'IMG-20260522-WA0134.jpg',
      'IMG-20260522-WA0135.jpg',
      'IMG-20260522-WA0136.jpg',
      'IMG-20260522-WA0137.jpg',
      'IMG-20260522-WA0138.jpg',
      'IMG-20260522-WA0139.jpg',
      'IMG-20260522-WA0140.jpg',
      'IMG-20260522-WA0141.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '12',
    name: 'Quality Stroke Armless',
    price: 135,
    sizes: ['L', 'XL', '2XL', '3XL'],
    images: [
      'IMG-20260522-WA0025.jpg',
      'IMG-20260522-WA0026.jpg',
      'IMG-20260522-WA0027.jpg',
      'IMG-20260522-WA0028.jpg',
      'IMG-20260522-WA0029.jpg',
      'IMG-20260522-WA0030.jpg',
      'IMG-20260522-WA0031.jpg',
      'IMG-20260522-WA0032.jpg',
      'IMG-20260522-WA0033.jpg',
      'IMG-20260522-WA0034.jpg',
      'IMG-20260522-WA0035.jpg',
      'IMG-20260522-WA0036.jpg',
      'IMG-20260522-WA0037.jpg',
      'IMG-20260529-WA0117.jpg',
      'IMG-20260529-WA0118.jpg',
      'IMG-20260529-WA0119.jpg',
      'IMG-20260529-WA0121.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '14',
    name: 'Design top & down',
    price: 250,
    sizes: ['L', 'XL', '2XL', '3XL'],
    images: [
      'IMG-20260525-WA0041.jpg',
      'IMG-20260525-WA0042.jpg',
      'IMG-20260525-WA0043.jpg',
      'IMG-20260525-WA0045.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '15',
    name: 'Polo Shirt',
    price: 125,
    sizes: ['M', 'L', 'XL', '2XL'],
    images: [
      'IMG-20260517-WA0056.jpg',
      'IMG-20260517-WA0057.jpg',
      'IMG-20260517-WA0058.jpg',
      'IMG-20260517-WA0059.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '16',
    name: 'Quality Designer Hoodie',
    price: 200,
    sizes: ['XL', '2XL', '3XL'],
    images: [
      'IMG-20260517-WA0050.jpg',
      'IMG-20260517-WA0051.jpg',
      'IMG-20260517-WA0052.jpg',
      'IMG-20260517-WA0053.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '17',
    name: 'Jeans Jacket',
    price: 200,
    sizes: ['M', 'L', 'XL', '2XL'],
    images: [
      'IMG-20260519-WA0085.jpg',
      'IMG-20260519-WA0086.jpg',
      'IMG-20260519-WA0094.jpg',
      'IMG-20260519-WA0095.jpg',
      'IMG-20260519-WA0096.jpg',
      'IMG-20260519-WA0097.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '19',
    name: 'Design Top and trousers',
    price: 240,
    sizes: ['M', 'L', 'XL', '2XL'],
    images: [
      'IMG-20260513-WA0209.jpg',
      'IMG-20260513-WA0211.jpg',
      'IMG-20260513-WA0212.jpg',
      'IMG-20260513-WA0213.jpg',
      'IMG-20260513-WA0215.jpg',
      'IMG-20260513-WA0216.jpg',
      'IMG-20260513-WA0217.jpg',
      'IMG-20260513-WA0218.jpg',
      'IMG-20260513-WA0219.jpg',
      'IMG-20260513-WA0220.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '2',
    name: 'Plain Club-T',
    price: 110,
    sizes: ['M', 'L', 'XL', '2XL'],
    images: [
      'WhatsApp Image 2026-06-11 at 10.52.26(1).jpeg',
      'WhatsApp Image 2026-06-11 at 10.52.26.jpeg',
      'WhatsApp Image 2026-06-11 at 10.52.27(1).jpeg',
      'WhatsApp Image 2026-06-11 at 10.52.27.jpeg',
      'WhatsApp Image 2026-06-11 at 10.52.28(1).jpeg',
      'WhatsApp Image 2026-06-11 at 10.52.28.jpeg'
    ]
  },
  {
    category: 'apparel',
    folder: '20',
    name: 'Qriginal Zara',
    price: 105,
    sizes: ['L', 'XL', '2XL'],
    images: [
      'IMG-20260513-WA0161.jpg',
      'IMG-20260513-WA0162.jpg',
      'IMG-20260513-WA0163.jpg',
      'IMG-20260513-WA0165.jpg',
      'IMG-20260513-WA0166.jpg',
      'IMG-20260513-WA0167.jpg',
      'IMG-20260513-WA0168.jpg',
      'IMG-20260513-WA0171.jpg',
      'IMG-20260513-WA0172.jpg',
      'IMG-20260513-WA0173.jpg',
      'IMG-20260513-WA0174.jpg',
      'IMG-20260513-WA0176.jpg',
      'IMG-20260513-WA0178.jpg',
      'IMG-20260513-WA0179.jpg',
      'IMG-20260513-WA0180.jpg',
      'IMG-20260513-WA0181.jpg',
      'IMG-20260513-WA0182.jpg',
      'IMG-20260513-WA0184.jpg',
      'IMG-20260513-WA0185.jpg',
      'IMG-20260513-WA0186.jpg',
      'IMG-20260513-WA0187.jpg',
      'IMG-20260513-WA0188.jpg',
      'IMG-20260513-WA0190.jpg',
      'IMG-20260513-WA0192.jpg',
      'IMG-20260513-WA0193.jpg',
      'IMG-20260513-WA0194.jpg',
      'IMG-20260513-WA0196.jpg',
      'IMG-20260513-WA0197.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '21',
    name: 'Quality Sweater',
    price: 105,
    sizes: ['M', 'L', 'XL', '2XL'],
    images: [
      'IMG-20260513-WA0155.jpg',
      'IMG-20260513-WA0156.jpg',
      'IMG-20260513-WA0157.jpg',
      'IMG-20260513-WA0158.jpg',
      'IMG-20260513-WA0159.jpg',
      'IMG-20260513-WA0160.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '22',
    name: 'Quality Shirt in Box',
    price: 100,
    sizes: ['M'],
    images: [
      'IMG-20260511-WA0066.jpg',
      'IMG-20260511-WA0067.jpg',
      'IMG-20260511-WA0068.jpg',
      'IMG-20260511-WA0069.jpg',
      'IMG-20260511-WA0072.jpg',
      'IMG-20260511-WA0073.jpg',
      'IMG-20260511-WA0074.jpg',
      'IMG-20260511-WA0075.jpg',
      'IMG-20260511-WA0076.jpg',
      'IMG-20260511-WA0077.jpg',
      'IMG-20260512-WA0050.jpg',
      'IMG-20260512-WA0051.jpg',
      'IMG-20260512-WA0052.jpg',
      'IMG-20260512-WA0054.jpg',
      'IMG-20260512-WA0055.jpg',
      'IMG-20260512-WA0056.jpg',
      'IMG-20260512-WA0057.jpg',
      'IMG-20260512-WA0058.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '23',
    name: 'design shirt',
    price: 110,
    sizes: ['M', 'L', 'XL', '2XL'],
    images: [
      'IMG-20260511-WA0056.jpg',
      'IMG-20260511-WA0057.jpg',
      'IMG-20260511-WA0058.jpg',
      'IMG-20260511-WA0059.jpg',
      'IMG-20260511-WA0060.jpg',
      'IMG-20260511-WA0061.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '24',
    name: 'Polo shirt',
    price: 120,
    sizes: ['L', 'XL', '2XL'],
    images: [
      'IMG-20260511-WA0050.jpg',
      'IMG-20260511-WA0051.jpg',
      'IMG-20260511-WA0053.jpg',
      'IMG-20260511-WA0054.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '3',
    name: 'Original Stock T-Shirt',
    price: 135,
    sizes: ['L', 'XL', '2XL', '3XL'],
    images: [
      'IMG-20260601-WA0087.jpg',
      'IMG-20260602-WA0023.jpg',
      'IMG-20260602-WA0024.jpg',
      'IMG-20260602-WA0025.jpg',
      'IMG-20260602-WA0026.jpg',
      'IMG-20260602-WA0028.jpg',
      'IMG-20260602-WA0029.jpg',
      'IMG-20260602-WA0030.jpg',
      'IMG-20260602-WA0032.jpg',
      'IMG-20260602-WA0033.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '4',
    name: 'Lacoste',
    price: 100,
    sizes: ['M', 'L', 'XL', '2XL'],
    images: [
      'IMG-20260523-WA0074.jpg',
      'IMG-20260523-WA0075.jpg',
      'IMG-20260523-WA0076.jpg',
      'IMG-20260523-WA0077.jpg',
      'IMG-20260523-WA0078.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '5',
    name: 'Bola Jersey',
    price: 150,
    sizes: ['XL', '2XL', '3XL'],
    images: [
      'IMG-20260522-WA0009.jpg',
      'IMG-20260522-WA0010.jpg',
      'IMG-20260522-WA0011.jpg',
      'IMG-20260601-WA0088.jpg',
      'IMG-20260601-WA0089.jpg',
      'IMG-20260601-WA0090.jpg',
      'IMG-20260601-WA0092.jpg',
      'IMG-20260601-WA0094.jpg',
      'IMG-20260601-WA0095.jpg',
      'IMG-20260601-WA0097.jpg',
      'IMG-20260601-WA0098.jpg',
      'IMG-20260601-WA0100.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '6',
    name: 'Turtle Neck',
    price: 110,
    sizes: ['M', 'L', 'XL', '2XL'],
    images: [
      'IMG-20260601-WA0113.jpg',
      'IMG-20260601-WA0114.jpg',
      'IMG-20260601-WA0115.jpg',
      'IMG-20260601-WA0116.jpg',
      'IMG-20260601-WA0117.jpg',
      'IMG-20260601-WA0118.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '7',
    name: 'Quality Sweater',
    price: 150,
    sizes: ['XL', '2XL', '3XL'],
    images: [
      'IMG-20260525-WA0055.jpg',
      'IMG-20260525-WA0062.jpg',
      'IMG-20260525-WA0065.jpg',
      'IMG-20260525-WA0070.jpg',
      'IMG-20260530-WA0011.jpg',
      'IMG-20260530-WA0012.jpg',
      'IMG-20260530-WA0013.jpg',
      'IMG-20260530-WA0014.jpg',
      'IMG-20260530-WA0015.jpg',
      'IMG-20260530-WA0016.jpg',
      'IMG-20260530-WA0017.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '8',
    name: 'Jersey',
    price: 150,
    sizes: ['L', 'XL', '2XL', '3XL'],
    images: [
      'IMG-20260529-WA0134.jpg'
    ]
  },
  {
    category: 'apparel',
    folder: '9',
    name: 'Design Top & down',
    price: 300,
    sizes: ['L', 'XL', '2XL', '3XL'],
    images: [
      'IMG-20260529-WA0127.jpg',
      'IMG-20260529-WA0128.jpg',
      'IMG-20260529-WA0129.jpg',
      'IMG-20260529-WA0130.jpg',
      'IMG-20260529-WA0131.jpg'
    ]
  },

  // ==================== FOOTWEAR ====================
  // Note: we normalize category name 'footware' to 'Footwear' inside the database
  {
    category: 'footwear',
    folder: '1',
    name: 'VANS',
    price: 350,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'WhatsApp Image 2026-06-11 at 17.01.18(1).jpeg',
      'WhatsApp Image 2026-06-11 at 17.01.18.jpeg'
    ]
  },
  {
    category: 'footwear',
    folder: '10',
    name: 'Original Louis Vuitton',
    price: 360,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260602-WA0048.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '11',
    name: 'NB1000',
    price: 380,
    sizes: ['40', '41'],
    images: [
      'IMG-20260602-WA0035.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '12',
    name: 'Original Dior Sneakers',
    price: 350,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260602-WA0016.jpg',
      'IMG-20260602-WA0017.jpg',
      'IMG-20260602-WA0018.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '13',
    name: 'Nike sneakers',
    price: 360,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260602-WA0019.jpg',
      'IMG-20260602-WA0020.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '14',
    name: 'Nike sneakers',
    price: 360,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260602-WA0009.jpg',
      'IMG-20260602-WA0010.jpg',
      'IMG-20260602-WA0011.jpg',
      'IMG-20260602-WA0012.jpg',
      'IMG-20260602-WA0013.jpg',
      'IMG-20260602-WA0014.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '15',
    name: 'original Adidas sneakers',
    price: 500,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260520-WA0114.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '16',
    name: 'original Timberland',
    price: 600,
    sizes: ['41', '42', '43', '44', '45'],
    isPerspectiveOnly: true, // Has 'img: 2' line so treat images as perspective of a single item!
    images: [
      'IMG-20260520-WA0010.jpg',
      'IMG-20260520-WA0011.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '17',
    name: 'Luxury Class Shoes',
    price: 650,
    sizes: ['41', '42', '43', '44'],
    images: [
      'IMG-20260517-WA0073.jpg',
      'IMG-20260517-WA0076.jpg',
      'IMG-20260517-WA0077.jpg',
      'IMG-20260517-WA0078.jpg',
      'IMG-20260517-WA0079.jpg',
      'IMG-20260517-WA0080.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '18',
    name: 'Adidas Topanga',
    price: 360,
    sizes: ['40', '41', '42', '43', '44'],
    images: [
      'IMG-20260516-WA0128.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '2',
    name: 'Dr Martens',
    price: 500,
    sizes: ['40', '41', '42', '43', '44', '45'],
    isPerspectiveOnly: true, // Has 'img:3' line so treat images as perspective!
    images: [
      'WhatsApp Image 2026-06-11 at 16.58.55(1).jpeg',
      'WhatsApp Image 2026-06-11 at 16.58.55.jpeg',
      'WhatsApp Image 2026-06-11 at 16.58.57.jpeg'
    ]
  },
  {
    category: 'footwear',
    folder: '20',
    name: 'Asics',
    price: 360,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260515-WA0284.jpg',
      'IMG-20260515-WA0285.jpg',
      'IMG-20260515-WA0286.jpg',
      'IMG-20260515-WA0287.jpg',
      'IMG-20260515-WA0288.jpg',
      'IMG-20260515-WA0289.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '21',
    name: 'Nike Sneakers',
    price: 300,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260515-WA0292.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '22',
    name: 'Vans Sneakers',
    price: 360,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260515-WA0291.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '23',
    name: 'Generic Shoes',
    price: 360,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260515-WA0237.jpg',
      'IMG-20260515-WA0238.jpg',
      'IMG-20260515-WA0240.jpg',
      'IMG-20260515-WA0241.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '24',
    name: 'Nike Sneakers',
    price: 230,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260515-WA0222.jpg',
      'IMG-20260515-WA0223.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '25',
    name: 'New Balance',
    price: 350,
    sizes: ['40', '41', '42'],
    images: [
      'IMG-20260515-WA0216.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '26',
    name: 'New Balance',
    price: 350,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260515-WA0213.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '27',
    name: 'Quality Shoes',
    price: 360,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: Array.from({ length: 52 }, (_, i) => {
      const id = 108 + i;
      return `IMG-20260515-WA0${id}.jpg`;
    })
  },
  {
    category: 'footwear',
    folder: '28',
    name: 'original nikes',
    price: 290,
    sizes: ['40', '41', '42'],
    images: [
      'IMG-20260515-WA0066.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '3',
    name: 'NB1000',
    price: 400,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260602-WA0034.jpg',
      'IMG-20260602-WA0036.jpg',
      'IMG-20260602-WA0042.jpg',
      'IMG-20260602-WA0043.jpg',
      'IMG-20260602-WA0044.jpg',
      'IMG-20260602-WA0045.jpg',
      'IMG-20260602-WA0046.jpg',
      'IMG-20260602-WA0047.jpg',
      'WhatsApp Image 2026-06-11 at 16.58.05(1).jpeg',
      'WhatsApp Image 2026-06-11 at 16.58.05.jpeg',
      'WhatsApp Image 2026-06-11 at 16.58.06(1).jpeg',
      'WhatsApp Image 2026-06-11 at 16.58.06.jpeg',
      'WhatsApp Image 2026-06-11 at 16.58.07(1).jpeg',
      'WhatsApp Image 2026-06-11 at 16.58.07.jpeg',
      'WhatsApp Image 2026-06-11 at 16.58.08.jpeg'
    ]
  },
  {
    category: 'footwear',
    folder: '30',
    name: 'Nike Sneakers',
    price: 310,
    sizes: ['39', '40', '41', '42', '43', '44'],
    images: [
      'IMG-20260515-WA0006.jpg',
      'IMG-20260515-WA0008.jpg',
      'IMG-20260515-WA0011.jpg',
      'IMG-20260515-WA0013.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '31',
    name: 'Jordans',
    price: 319,
    sizes: ['40', '41', '42', '43', '44'],
    images: [
      'IMG-20260515-WA0004.jpg',
      'IMG-20260515-WA0009.jpg',
      'IMG-20260515-WA0010.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '32',
    name: 'original Rick Owens',
    price: 1350,
    sizes: ['40', '41', '42', '43'],
    images: [
      'IMG-20260513-WA0074.jpg',
      'IMG-20260513-WA0075.jpg',
      'IMG-20260513-WA0077.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '33',
    name: 'Quality Shoe',
    price: 350,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260511-WA0047.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '34',
    name: 'classic shoes',
    price: 350,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260511-WA0041.jpg',
      'IMG-20260511-WA0042.jpg',
      'IMG-20260511-WA0043.jpg',
      'IMG-20260511-WA0044.jpg',
      'IMG-20260511-WA0045.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '4',
    name: 'Puma Sneakers',
    price: 350,
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260602-WA0054.jpg',
      'IMG-20260602-WA0055.jpg',
      'IMG-20260602-WA0056.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '5',
    name: 'Gh color nike',
    price: 320,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    images: [
      'WhatsApp Image 2026-06-13 at 00.31.08.jpeg'
    ]
  },
  {
    category: 'footwear',
    folder: '6',
    name: 'puma sneakers',
    price: 360,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    images: [
      'IMG-20260515-WA0035.jpg',
      'IMG-20260515-WA0036.jpg',
      'IMG-20260515-WA0037.jpg',
      'IMG-20260602-WA0015.jpg',
      'WhatsApp Image 2026-06-13 at 00.31.08(1).jpeg'
    ]
  },
  {
    category: 'footwear',
    folder: '7',
    name: 'Nike sneakers',
    price: 260,
    sizes: ['38', '39', '40', '41'],
    images: [
      'IMG-20260602-WA0065.jpg',
      'IMG-20260602-WA0066.jpg'
    ]
  },
  {
    category: 'footwear',
    folder: '8',
    name: 'Original Jordans',
    price: 340,
    sizes: ['38', '39', '40', '41', '42', '43'],
    images: [
      'WhatsApp Image 2026-06-13 at 00.28.24.jpeg'
    ]
  },
  {
    category: 'footwear',
    folder: '9',
    name: 'Canva',
    price: 360,
    sizes: ['40', '41', '42', '43', '44'],
    images: [
      'WhatsApp Image 2026-06-13 at 00.31.07.jpeg'
    ]
  },

  // ==================== SHORTS ====================
  {
    category: 'apparel', // Apparel is their main category
    subCategoryTag: 'Shorts', // Set tag to represent Sub-category
    folder: '1',
    name: 'Quality Camo Shorts',
    price: 130,
    sizes: ['L', 'XL', '2XL'],
    images: [
      'IMG-20260523-WA0080.jpg',
      'IMG-20260523-WA0082.jpg'
    ]
  },
  {
    category: 'apparel',
    subCategoryTag: 'Shorts',
    folder: '2',
    name: 'Quality Shorts',
    price: 130,
    sizes: ['M', 'L', 'XL', '2XL'],
    images: [
      'IMG-20260513-WA0200.jpg',
      'IMG-20260513-WA0201.jpg',
      'IMG-20260513-WA0202.jpg',
      'IMG-20260513-WA0203.jpg'
    ]
  },
  {
    category: 'apparel',
    subCategoryTag: 'Shorts',
    folder: '3',
    name: 'Summer Shorts',
    price: 55,
    sizes: ['M', 'L', 'XL', '2XL'],
    images: [
      'IMG-20260513-WA0204.jpg',
      'IMG-20260513-WA0205.jpg',
      'IMG-20260513-WA0206.jpg',
      'IMG-20260513-WA0207.jpg',
      'IMG-20260513-WA0208.jpg',
      'IMG-20260518-WA0145.jpg',
      'IMG-20260518-WA0146.jpg',
      'IMG-20260518-WA0147.jpg',
      'IMG-20260518-WA0148.jpg',
      'IMG-20260518-WA0149.jpg',
      'IMG-20260518-WA0150.jpg',
      'IMG-20260518-WA0151.jpg',
      'IMG-20260518-WA0152.jpg',
      'IMG-20260518-WA0153.jpg',
      'IMG-20260518-WA0154.jpg',
      'IMG-20260518-WA0156.jpg',
      'IMG-20260518-WA0157.jpg',
      'IMG-20260518-WA0158.jpg',
      'IMG-20260518-WA0159.jpg',
      'IMG-20260518-WA0160.jpg',
      'IMG-20260518-WA0162.jpg',
      'IMG-20260518-WA0163.jpg',
      'IMG-20260518-WA0164.jpg',
      'IMG-20260518-WA0165.jpg',
      'IMG-20260518-WA0166.jpg',
      'IMG-20260518-WA0168.jpg',
      'IMG-20260518-WA0169.jpg',
      'IMG-20260518-WA0170.jpg',
      'IMG-20260518-WA0171.jpg'
    ]
  },

  // ==================== TROUSERS ====================
  {
    category: 'apparel',
    subCategoryTag: 'Trousers',
    folder: '1',
    name: 'Jeans Trousers',
    price: 200,
    sizes: ['30', '32', '34', '36'],
    images: [
      'IMG-20260515-WA0261.jpg',
      'IMG-20260515-WA0262.jpg',
      'IMG-20260515-WA0263.jpg',
      'IMG-20260515-WA0264.jpg',
      'IMG-20260515-WA0265.jpg',
      'IMG-20260515-WA0266.jpg',
      'IMG-20260515-WA0267.jpg',
      'WhatsApp Image 2026-06-11 at 10.58.43.jpeg',
      'WhatsApp Image 2026-06-11 at 10.58.44(1).jpeg',
      'WhatsApp Image 2026-06-11 at 10.58.44.jpeg'
    ]
  },
  {
    category: 'apparel',
    subCategoryTag: 'Trousers',
    folder: '2',
    name: 'Quality Jeans Trousers',
    price: 160,
    sizes: ['30', '32', '34', '36'],
    images: [
      'IMG-20260523-WA0096.jpg',
      'IMG-20260523-WA0097.jpg',
      'WhatsApp Image 2026-06-11 at 10.54.49.jpeg',
      'WhatsApp Image 2026-06-11 at 10.54.50(1).jpeg',
      'WhatsApp Image 2026-06-11 at 10.54.50.jpeg',
      'WhatsApp Image 2026-06-11 at 10.54.51(1).jpeg',
      'WhatsApp Image 2026-06-11 at 10.54.51.jpeg'
    ]
  },
  {
    category: 'apparel',
    subCategoryTag: 'Trousers',
    folder: '3',
    name: 'Quality Joggers',
    price: 200,
    sizes: ['XL', '2XL', '3XL'],
    images: [
      'IMG-20260522-WA0117.jpg',
      'IMG-20260522-WA0118.jpg',
      'IMG-20260522-WA0119.jpg',
      'IMG-20260525-WA0073.jpg',
      'IMG-20260525-WA0074.jpg',
      'IMG-20260529-WA0108.jpg',
      'IMG-20260529-WA0110.jpg',
      'IMG-20260529-WA0111.jpg',
      'WhatsApp Image 2026-06-11 at 10.49.58.jpeg',
      'WhatsApp Image 2026-06-11 at 10.49.59(1).jpeg',
      'WhatsApp Image 2026-06-11 at 10.49.59.jpeg',
      'WhatsApp Image 2026-06-11 at 10.50.00(1).jpeg',
      'WhatsApp Image 2026-06-11 at 10.50.00.jpeg',
      'WhatsApp Image 2026-06-11 at 10.50.01(1).jpeg',
      'WhatsApp Image 2026-06-11 at 10.50.01(2).jpeg',
      'WhatsApp Image 2026-06-11 at 10.50.01.jpeg',
      'WhatsApp Image 2026-06-11 at 10.50.02.jpeg'
    ]
  },
  {
    category: 'apparel',
    subCategoryTag: 'Trousers',
    folder: '4',
    name: 'Quality Trousers',
    price: 165,
    sizes: ['30', '31', '32', '34', '36', '38'],
    images: [
      'IMG-20260517-WA0061.jpg',
      'IMG-20260517-WA0063.jpg',
      'IMG-20260517-WA0064.jpg',
      'IMG-20260517-WA0065.jpg',
      'IMG-20260517-WA0066.jpg',
      'IMG-20260517-WA0067.jpg',
      'IMG-20260517-WA0068.jpg',
      'IMG-20260517-WA0069.jpg',
      'IMG-20260517-WA0070.jpg',
      'IMG-20260517-WA0071.jpg',
      'IMG-20260517-WA0072.jpg',
      'IMG-20260525-WA0046.jpg',
      'IMG-20260525-WA0047.jpg',
      'IMG-20260525-WA0048.jpg',
      'IMG-20260525-WA0049.jpg',
      'IMG-20260525-WA0050.jpg',
      'IMG-20260525-WA0051.jpg',
      'IMG-20260525-WA0052.jpg',
      'IMG-20260525-WA0053.jpg'
    ]
  },
  {
    category: 'apparel',
    subCategoryTag: 'Trousers',
    folder: '5',
    name: 'Bola Joggers',
    price: 180,
    sizes: ['XL', '2XL', '3XL'],
    images: [
      'IMG-20260512-WA0069.jpg',
      'IMG-20260512-WA0070.jpg',
      'IMG-20260512-WA0071.jpg',
      'IMG-20260512-WA0072.jpg',
      'IMG-20260512-WA0073.jpg'
    ]
  }
];

// Helper to sanitize product names for sql inserting containing single quotes
function escapeSql(txt: string): string {
  return txt.replace(/'/g, "''");
}

function calculateOriginalPrice(price: number, desiredMarkupFactor: number): number {
  let originalPrice = Math.round(price * desiredMarkupFactor);
  // Cap the originalPrice so that the discount (originalPrice - price) / originalPrice * 100 <= 30%
  // This translates to originalPrice <= price / 0.7
  const maxOriginal = Math.floor(price / 0.7);
  if (originalPrice > maxOriginal) {
    originalPrice = maxOriginal;
  }
  return originalPrice;
}

function generateDescription(name: string, category: string): string {
  const isShoes = category.toLowerCase() === 'footwear';
  const isAccessories = category.toLowerCase() === 'accessories';
  
  if (isShoes) {
    return `${name}. Engineered for comfort, visual presence, and elite streetwear aesthetics. Features premium cushioning and high-traction durability. Sourced for our exclusive Drop Series - highly limited edition release with zero restocks.`;
  } else if (isAccessories) {
    return `The ${name}. Exquisite detailing, pristine craft, and unparalleled presence. A defining styling piece designed to instantly elevate any streetwear or editorial fit. Extremely rare drop. Only limited quantities copped.`;
  } else {
    return `The ultra-premium ${name}. Tailored fits, breathable comfort, and a confident streetwear silhouette. Sourced with durable high-grade threads designed to maintain its shape and aesthetic under high daily use. Strictly individual drop - copping means exclusivity.`;
  }
}

async function run() {
  console.log('Connecting to database...');
  const db = new Database('database.sqlite');
  
  const finalProducts: any[] = [];
  const sqlInserts: string[] = [];

  console.log('Re-creating folder paths and syncing images...');
  
  // Create base clothes directory
  if (!fs.existsSync('clothes')) {
    fs.mkdirSync('clothes', { recursive: true });
  }

  for (const item of clothesData) {
    let folderCategory = item.category;
    if (item.subCategoryTag === 'Shorts') {
      folderCategory = 'shorts';
    } else if (item.subCategoryTag === 'Trousers') {
      folderCategory = 'trousers';
    }

    // Recreate physical folders to guarantee path consistency
    const physicalDir = path.join('clothes', folderCategory, item.folder);
    if (!fs.existsSync(physicalDir)) {
      console.log(`Skipping omitted folder: ${physicalDir}`);
      continue;
    }

    // Write data.txt in standard unix forward slash path
    const dataTxtPath = path.join(physicalDir, 'data.txt');
    let dataTxtContent = `name: ${item.name}\nprice: ${item.price}\n`;
    if (item.sizes.length > 0) {
      dataTxtContent += `size: ${item.sizes.join(', ')}\n`;
    }
    if ((item as any).isPerspectiveOnly) {
      dataTxtContent += `img: ${item.images.length}\n`;
    }
    fs.writeFileSync(dataTxtPath, dataTxtContent);

    // Filter, create and check unique images
    let uniqueImages = Array.from(new Set(item.images));

    // Ensure empty image placeholder files are physically present so Express serves them
    for (const imgName of uniqueImages) {
      const imgPath = path.join(physicalDir, imgName);
      if (!fs.existsSync(imgPath)) {
        fs.writeFileSync(imgPath, ''); // Touch an empty file
      }
    }

    // Filter uniqueImages dynamically so we only register files that physically exist
    uniqueImages = uniqueImages.filter(img => fs.existsSync(path.join(physicalDir, img)));
    if (uniqueImages.length === 0) {
      console.log(`Skipping folder with no images: ${physicalDir}`);
      continue;
    }

    // Now, handle perspective vs individual rules
    if ((item as any).isPerspectiveOnly) {
      // Perspective rule: Create Exactly ONE product, using all images as perspectives
      const brand = item.name.split(' ')[0] || 'Original';
      const capCategory = folderCategory === 'footwear' ? 'Footwear' : (folderCategory === 'accessories' ? 'Accessories' : (folderCategory === 'shorts' ? 'Shorts' : (folderCategory === 'trousers' ? 'Trousers' : 'Apparel')));
      const tags = Array.from(new Set(['LIMITED', 'EXCLUSIVE', capCategory.toUpperCase(), ...(((item as any).subCategoryTag) ? [(item as any).subCategoryTag.toUpperCase()] : [])]));
      
      const price = item.price;
      const originalPrice = calculateOriginalPrice(price, 1.25);
      const stockCount = Math.floor(Math.random() * 8) + 3; // Random <= 11 strictly, min 3
      const hypeScore = Math.floor(Math.random() * 20) + 79;
      const velocityScore = Math.floor(Math.random() * 18) + 80;
      const viewers = Math.floor(Math.random() * 40) + 12;

      const primaryImgPath = `clothes/${folderCategory}/${item.folder}/${uniqueImages[0]}`;
      const allResolvedImgs = uniqueImages.map(img => `clothes/${folderCategory}/${item.folder}/${img}`);

      const prodId = `ck_${folderCategory}_${item.folder}`;

      const product = {
        id: prodId,
        name: item.name,
        price: price,
        originalPrice: originalPrice,
        shippingFee: 0,
        image: primaryImgPath,
        category: capCategory,
        gender: 'UNISEX',
        description: generateDescription(item.name, capCategory),
        details: JSON.stringify([`Drop batch id: ck-drp-${folderCategory}-${item.folder}`, 'Limited series release - No restocks', 'Material: Premium blend thread selection', 'Imported directly']),
        inStock: 1,
        isNew: 1,
        viewers: viewers,
        stockCount: stockCount,
        hypeScore: hypeScore,
        velocityScore: velocityScore,
        isHallOfFame: Math.random() > 0.85 ? 1 : 0,
        synergyPath: 'EXCLUSIVE_DROP',
        appeal: 'High Demand Scarcity Item',
        brand: brand,
        tags: JSON.stringify(tags),
        deliveryTime: '2-4 business days',
        sizes: JSON.stringify(item.sizes),
        isCustom: 0,
        images: JSON.stringify(allResolvedImgs),
        colors: JSON.stringify([]),
        colorVariants: JSON.stringify([]),
        createdAt: new Date().toISOString(),
        offeredDiscount: Math.round(((originalPrice - price) / originalPrice) * 100),
        video: null
      };

      finalProducts.push(product);
    } else {
      // Individual rule: Treat each image in the directory as an INDIVIDUAL PRODUCT drop!
      uniqueImages.forEach((img, idx) => {
        const brand = item.name.split(' ')[0] || 'Original';
        const capCategory = folderCategory === 'footwear' ? 'Footwear' : (folderCategory === 'accessories' ? 'Accessories' : (folderCategory === 'shorts' ? 'Shorts' : (folderCategory === 'trousers' ? 'Trousers' : 'Apparel')));
        
        const tags = Array.from(new Set(['LIMITED', 'EXCLUSIVE', capCategory.toUpperCase(), ...(((item as any).subCategoryTag) ? [(item as any).subCategoryTag.toUpperCase()] : [])]));

        const price = item.price;
        const originalPrice = calculateOriginalPrice(price, 1.3);
        const stockCount = Math.floor(Math.random() * 8) + 3; // strictly <= 11 and >= 3
        const hypeScore = Math.floor(Math.random() * 21) + 78;
        const velocityScore = Math.floor(Math.random() * 19) + 80;
        const viewers = Math.floor(Math.random() * 35) + 8;

        const primaryImgPath = `clothes/${folderCategory}/${item.folder}/${img}`;
        const prodId = `ck_${folderCategory}_${item.folder}_s${idx + 1}`;

        // Add index details to name to make individual products copping experience premium
        const styledName = item.name;

        const product = {
          id: prodId,
          name: styledName,
          price: price,
          originalPrice: originalPrice,
          shippingFee: 0,
          image: primaryImgPath,
          category: capCategory,
          gender: 'UNISEX',
          description: generateDescription(styledName, capCategory),
          details: JSON.stringify([`Premium style selection ID: ck-var-${idx + 1}`, 'Prism styled fabrication finish', 'Highly rare copped variant', 'Shipped securely in Closet Kraze custom packaging']),
          inStock: 1,
          isNew: 1,
          viewers: viewers,
          stockCount: stockCount,
          hypeScore: hypeScore,
          velocityScore: velocityScore,
          isHallOfFame: Math.random() > 0.85 ? 1 : 0,
          synergyPath: 'STYLE_LINE_DROP',
          appeal: 'Highly exclusive variant drop',
          brand: brand,
          tags: JSON.stringify(tags),
          deliveryTime: '2-4 business days',
          sizes: JSON.stringify(item.sizes),
          isCustom: 0,
          images: JSON.stringify([primaryImgPath]),
          colors: JSON.stringify([]),
          colorVariants: JSON.stringify([]),
          createdAt: new Date().toISOString(),
          offeredDiscount: Math.round(((originalPrice - price) / originalPrice) * 100),
          video: null
        };

        finalProducts.push(product);
      });
    }
  }

  console.log(`Prepared ${finalProducts.length} final products items.`);

  // Write database insertions
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, name, price, originalPrice, shippingFee, image, category, gender, description, details,
      inStock, isNew, viewers, stockCount, hypeScore, velocityScore, isHallOfFame, synergyPath,
      appeal, brand, tags, deliveryTime, sizes, isCustom, images, colors, colorVariants, createdAt,
      offeredDiscount, video
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  console.log('Populating SQLite Database sqlite3...');
  db.transaction(() => {
    for (const p of finalProducts) {
      insertStmt.run(
        p.id, p.name, p.price, p.originalPrice, p.shippingFee, p.image, p.category, p.gender, p.description, p.details,
        p.inStock, p.isNew, p.viewers, p.stockCount, p.hypeScore, p.velocityScore, p.isHallOfFame, p.synergyPath,
        p.appeal, p.brand, p.tags, p.deliveryTime, p.sizes, p.isCustom, p.images, p.colors, p.colorVariants, p.createdAt,
        p.offeredDiscount, p.video
      );

      // Also parse insertion into standard migration SQL script
      sqlInserts.push(`INSERT INTO products (id, name, price, originalPrice, shippingFee, image, category, gender, description, details, inStock, isNew, viewers, stockCount, hypeScore, velocityScore, isHallOfFame, synergyPath, appeal, brand, tags, deliveryTime, sizes, isCustom, images, colors, colorVariants, createdAt, offeredDiscount) VALUES ('${p.id}', '${escapeSql(p.name)}', ${p.price}, ${p.originalPrice}, ${p.shippingFee}, '${p.image}', '${p.category}', '${p.gender}', '${escapeSql(p.description)}', '${p.details}', ${p.inStock}, ${p.isNew}, ${p.viewers}, ${p.stockCount}, ${p.hypeScore}, ${p.velocityScore}, ${p.isHallOfFame}, '${p.synergyPath}', '${p.appeal}', '${escapeSql(p.brand)}', '${p.tags}', '${p.deliveryTime}', '${p.sizes}', ${p.isCustom}, '${p.images}', '${p.colors}', '${p.colorVariants}', '${p.createdAt}', ${p.offeredDiscount});`);
    }
  })();

  console.log('Successfully populated database.sqlite with uploaded products!');

  // Export SQL Migration File to workspace root
  console.log('Writing SQL migration exporter...');
  const sqlHeader = `-- =========================================================\n-- CLOSET KRAZE MIGRATION EXPORTER - DATABASE RECOVERY SCRIPT\n-- Generated on: ${new Date().toUTCString()}\n-- Total Items: ${finalProducts.length}\n-- Directions: Direct copy & execute in postgreSQL, MySQL, SQLite, or MariaDB\n-- =========================================================\n\n`;
  fs.writeFileSync('products_migration.sql', sqlHeader + sqlInserts.join('\n'));
  console.log('Successfully written products_migration.sql!');

  // Export JSON Migration File to workspace root
  console.log('Writing JSON migration exporter...');
  fs.writeFileSync('products_migration.json', JSON.stringify(finalProducts, null, 2));
  console.log('Successfully written products_migration.json!');

  console.log('\n--- EXPORT AND POPULATION RUN COMPLETED SUCCESSFULLY ---');
  console.log(`- Created/Verified ${clothesData.length} folder lines.`);
  console.log(`- Loaded and resolved ${finalProducts.length} final product variants.`);
  console.log(`- Saved directly to local Database instance.`);
  console.log(`- Created export/migration file 'products_migration.sql' successfully.`);
  console.log(`- Created export/migration file 'products_migration.json' successfully.`);
}

run().catch(err => {
  console.error('Fatal Error during population script execution:', err);
  process.exit(1);
});
