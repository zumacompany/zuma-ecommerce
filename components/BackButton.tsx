"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
    const router = useRouter();

    const handleBack = () => {
        // Check if there's history to go back to
        if (window.history.length > 1) {
            router.back();
        } else {
            // If no history, go to home
            router.push('/');
        }
    };

    return (
        <button
            onClick={handleBack}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-md hover:bg-muted/10 text-muted transition-colors"
            aria-label="Go back"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>
    );
}
