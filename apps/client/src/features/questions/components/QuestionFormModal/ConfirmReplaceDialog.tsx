import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface ConfirmReplaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function ConfirmReplaceDialog({ open, onOpenChange, onConfirm }: ConfirmReplaceDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <DialogTitle>Replace Content?</DialogTitle>
                    <DialogDescription>
                        This will overwrite your current description and starter code with AI-generated content.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 px-6 py-5">
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            onOpenChange(false);
                            onConfirm();
                        }}
                    >
                        Replace
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
