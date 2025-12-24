
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { FieldErrors } from "react-hook-form";

interface ErrorSummaryProps {
  errors: FieldErrors;
  title?: string;
}

// A recursive function to flatten and extract all error messages.
const getErrorMessages = (errors: FieldErrors, parentKey = ''): string[] => {
  let messages: string[] = [];
  for (const key in errors) {
    const error = errors[key];
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (error) {
      if (typeof error.message === 'string') {
        messages.push(error.message);
      } else if (Array.isArray(error)) {
         error.forEach((item, index) => {
            if (item && typeof item.message === 'string') {
                messages.push(item.message);
            } else if (typeof item === 'object') {
                messages = messages.concat(getErrorMessages(item as FieldErrors, `${newKey}[${index}]`));
            }
         });
      } else if (typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
        messages.push((error as any).message);
      }
    }
  }
  return [...new Set(messages)]; // Return unique messages
};


export function ErrorSummary({ errors, title = "Please fix the errors below" }: ErrorSummaryProps) {
  const errorMessages = getErrorMessages(errors);

  if (errorMessages.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          {errorMessages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
