import type { Screen } from "@/App";
import ConfirmDialog from "@/components/ConfirmDialog";
import TuitionForm from "@/components/TuitionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrency,
  getDuePendingAmount,
  getOverdueCount,
  useAppStore,
} from "@/store/useAppStore";
import type { Tuition } from "@/store/useAppStore";
import { ChevronRight, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  navigate: (s: Screen) => void;
}

export default function Tuitions({ navigate }: Props) {
  const tuitions = useAppStore((s) => s.tuitions);
  const dues = useAppStore((s) => s.dues);
  const deleteTuition = useAppStore((s) => s.deleteTuition);

  const [showForm, setShowForm] = useState(false);
  const [editTuition, setEditTuition] = useState<Tuition | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    deleteTuition(deleteId);
    setDeleteId(null);
    toast.success("Tuition deleted");
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display text-foreground">
          Students
        </h1>
        <Button
          size="sm"
          data-ocid="students.add.primary_button"
          onClick={() => {
            setEditTuition(null);
            setShowForm(true);
          }}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Tuition
        </Button>
      </div>

      {tuitions.length === 0 ? (
        <Card data-ocid="students.empty_state" className="shadow-card">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No tuitions yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a tuition family to start tracking
            </p>
            <Button
              size="sm"
              className="mt-4"
              data-ocid="students.empty.primary_button"
              onClick={() => {
                setEditTuition(null);
                setShowForm(true);
              }}
            >
              Add Tuition
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tuitions.map((t, idx) => {
            const pending = getDuePendingAmount(t.id, dues);
            const overdue = getOverdueCount(t.id, dues);
            return (
              <Card
                key={t.id}
                data-ocid={`students.tuition.item.${idx + 1}`}
                className="shadow-card"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() =>
                        navigate({
                          tab: "students",
                          view: "detail",
                          tuitionId: t.id,
                        })
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {t.name}
                        </span>
                        {!t.isActive && (
                          <Badge variant="secondary" className="text-[10px]">
                            Inactive
                          </Badge>
                        )}
                        {overdue > 0 && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5"
                          >
                            {overdue} overdue
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.students.join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(t.monthlyFee)}/mo
                        {pending > 0 && (
                          <span className="text-destructive font-medium ml-2">
                            {formatCurrency(pending)} pending
                          </span>
                        )}
                        {pending === 0 && (
                          <span className="text-success font-medium ml-2">
                            All paid
                          </span>
                        )}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-ocid={`students.tuition.edit_button.${idx + 1}`}
                        onClick={() => {
                          setEditTuition(t);
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        data-ocid={`students.tuition.delete_button.${idx + 1}`}
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight
                        className="w-4 h-4 text-muted-foreground cursor-pointer"
                        onClick={() =>
                          navigate({
                            tab: "students",
                            view: "detail",
                            tuitionId: t.id,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TuitionForm
        open={showForm}
        tuition={editTuition}
        onClose={() => {
          setShowForm(false);
          setEditTuition(null);
        }}
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Tuition"
        description="This will permanently delete the tuition, all its dues, payments, and attendance records."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
