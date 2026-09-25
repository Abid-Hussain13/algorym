import { QuestionPicker } from "@/features/sessions/components/QuestionPicker";
import type { Question } from "@algorym/shared-types";

interface StepQuestionProps {
    questions: Question[];
    search: string;
    onSearchChange: (value: string) => void;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    selectedLanguage: string;
    onLanguageSelect: (language: string) => void;
    isLoading: boolean;
}

export function StepQuestion({
    questions,
    search,
    onSearchChange,
    selectedIds,
    onSelectionChange,
    selectedLanguage,
    onLanguageSelect,
    isLoading,
}: StepQuestionProps) {
    return (
        <QuestionPicker
            questions={questions}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            search={search}
            onSearchChange={onSearchChange}
            selectedLanguage={selectedLanguage}
            onLanguageSelect={onLanguageSelect}
            isLoading={isLoading}
            emptyMessage="No questions available"
        />
    );
}
