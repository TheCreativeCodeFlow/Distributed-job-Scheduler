'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../store/auth';
import { useToast } from '../../components/feedback/toasts';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/card';
import { Database } from 'lucide-react';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setLoading(true);
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
      const { accessToken, refreshToken, user } = response.data;

      setSession({
        accessToken,
        refreshToken,
        user,
      });

      toast.success('Successfully logged in!', `Welcome back, ${user.email}.`);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Invalid email or password.';
      toast.error('Authentication Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <Card className="relative z-10 w-full max-w-md bg-card/60 backdrop-blur-md shadow-2xl hoverEffect glow">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3 text-primary animate-pulse">
              <Database className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              TASKFLOW
            </CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              Sign in to manage your distributed jobs
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              type="password"
              placeholder="Password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full mt-2" loading={loading}>
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
