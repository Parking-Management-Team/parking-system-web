import { LoginForm } from '@/features/auth';

export const metadata = {
  title: 'Sign In - NexPark Smart Parking',
  description: 'Log in to your NexPark account to manage enterprise smart parking logistics and slots.',
};

export default function LoginPage() {
  return <LoginForm />;
}
