'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Database, Eye, EyeOff, Check, X } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .refine(
      (val) => /[A-Z]/.test(val),
      'Must contain at least one uppercase letter',
    )
    .refine(
      (val) => /[a-z]/.test(val),
      'Must contain at least one lowercase letter',
    )
    .refine((val) => /[0-9]/.test(val), 'Must contain at least one number'),
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setLoading(true);
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      await axios.post(`${API_BASE_URL}/auth/register`, {
        email: data.email,
        name: data.name,
        password: data.password,
      });

      toast.success(
        'Registration Successful!',
        'Your enterprise account has been created. Please sign in.',
      );
      router.push('/login');
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err.response?.data?.detail || 'An error occurred during registration.';
      toast.error('Registration Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Password rules validation for live check UI
  const passwordRules = [
    { label: 'At least 8 characters', check: passwordValue.length >= 8 },
    {
      label: 'At least one uppercase letter',
      check: /[A-Z]/.test(passwordValue),
    },
    {
      label: 'At least one lowercase letter',
      check: /[a-z]/.test(passwordValue),
    },
    { label: 'At least one number', check: /[0-9]/.test(passwordValue) },
  ];

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background px-4 py-8">
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
              Create Enterprise Account
            </CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              Sign up to deploy and monitor your distributed tasks
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              type="text"
              placeholder="Enterprise / Full Name"
              error={errors.name?.message}
              {...register('name')}
              aria-label="Name"
            />

            <Input
              type="email"
              placeholder="Work email address"
              error={errors.email?.message}
              {...register('email')}
              aria-label="Email Address"
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Choose password"
                error={errors.password?.message}
                {...register('password', {
                  onChange: (e) => setPasswordValue(e.target.value),
                })}
                aria-label="Password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Live Password Strength Indicator */}
            {passwordValue && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
                <span className="font-semibold text-muted-foreground">
                  Password requirements:
                </span>
                <ul className="space-y-1">
                  {passwordRules.map((rule, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      {rule.check ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/50" />
                      )}
                      <span
                        className={
                          rule.check
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground'
                        }
                      >
                        {rule.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" loading={loading}>
              Create Account
            </Button>

            <div className="text-center text-xs font-semibold text-muted-foreground mt-4 select-none">
              Already have an enterprise account?{' '}
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
