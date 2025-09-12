import { getProducts } from '../../lib/getProducts';
import { getCategories } from '../../lib/getCategories'; // Assuming a similar function for categories
import { Product, Category } from '../../lib/types';
import HomeClient from './HomeClient';

const HomePage = async () => {
  // Fetch data on the server
  const products: Product[] = getProducts();
  const categories: Category[] = await getCategories();

  return <HomeClient products={products} categories={categories} />;
};

export default HomePage;

