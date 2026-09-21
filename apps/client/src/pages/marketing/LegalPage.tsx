import { PrivacyContent } from "./components/PrivacyContent";
import { TermsContent } from "./components/TermsContent";

export function LegalPage({ variant }: { variant: 'terms' | 'privacy' }) {
    return (
        <div className="mx-auto max-w-[800px] px-5 py-[72px] md:px-10 md:py-[96px]">
            {variant === 'privacy' ? <PrivacyContent /> : <TermsContent />}
        </div>
    );
}
