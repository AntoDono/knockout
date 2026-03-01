"use client";
import { useState } from "react";
import { Bell, Mail, Phone, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Clinician {
  name: string;
  role: string;
  email: string;
}

interface Guardian {
  name: string;
  relationship: string;
  phone: string;
}

const initialCareTeam: Clinician[] = [
  { name: "Dr. Rachel Torres", role: "Pediatric Cardiologist", email: "michael.chen@childrens.org" },
  { name: "Dr. James Liu", role: "Electrophysiologist", email: "sarah.williams@heartcenter.org" },
];

const initialGuardians: Guardian[] = [
  { name: "Ravi Chen", relationship: "Father", phone: "(555) 301-4422" },
  { name: "Sunita Chen", relationship: "Mother", phone: "(555) 301-4423" },
  { name: "Sophie Park", relationship: "Best Friend", phone: "(555) 718-2290" },
];

function EditCareTeamDialog({
  careTeam,
  onSave,
}: {
  careTeam: Clinician[];
  onSave: (updated: Clinician[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Clinician[]>([]);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setDraft(careTeam.map((c) => ({ ...c })));
    setOpen(isOpen);
  };

  const updateField = (i: number, field: keyof Clinician, value: string) => {
    setDraft((prev) => prev.map((c, j) => (j === i ? { ...c, [field]: value } : c)));
  };

  const addRow = () => setDraft((prev) => [...prev, { name: "", role: "", email: "" }]);

  const removeRow = (i: number) => setDraft((prev) => prev.filter((_, j) => j !== i));

  const handleSave = () => {
    onSave(draft.filter((c) => c.name.trim() && c.email.trim()));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-xs">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Care Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto">
          {draft.map((c, i) => (
            <div key={i} className="space-y-2 p-3 rounded-xl border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Contact {i + 1}</span>
                <Button variant="ghost" size="icon-xs" onClick={() => removeRow(i)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={c.name} onChange={(e) => updateField(i, "name", e.target.value)} placeholder="Dr. Jane Smith" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={c.role} onChange={(e) => updateField(i, "role", e.target.value)} placeholder="Cardiologist" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={c.email} onChange={(e) => updateField(i, "email", e.target.value)} placeholder="doctor@hospital.org" />
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={addRow}>
            <Plus className="h-4 w-4" /> Add Clinician
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditGuardiansDialog({
  guardians,
  onSave,
}: {
  guardians: Guardian[];
  onSave: (updated: Guardian[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Guardian[]>([]);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setDraft(guardians.map((g) => ({ ...g })));
    setOpen(isOpen);
  };

  const updateField = (i: number, field: keyof Guardian, value: string) => {
    setDraft((prev) => prev.map((g, j) => (j === i ? { ...g, [field]: value } : g)));
  };

  const addRow = () => setDraft((prev) => [...prev, { name: "", relationship: "", phone: "" }]);

  const removeRow = (i: number) => setDraft((prev) => prev.filter((_, j) => j !== i));

  const handleSave = () => {
    onSave(draft.filter((g) => g.name.trim() && g.phone.trim()));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-xs">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Friends & Guardians</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto">
          {draft.map((g, i) => (
            <div key={i} className="space-y-2 p-3 rounded-xl border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Contact {i + 1}</span>
                <Button variant="ghost" size="icon-xs" onClick={() => removeRow(i)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={g.name} onChange={(e) => updateField(i, "name", e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input value={g.relationship} onChange={(e) => updateField(i, "relationship", e.target.value)} placeholder="Father" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" value={g.phone} onChange={(e) => updateField(i, "phone", e.target.value)} placeholder="(555) 123-4567" />
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={addRow}>
            <Plus className="h-4 w-4" /> Add Contact
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EmergencyContacts() {
  const [careTeam, setCareTeam] = useState<Clinician[]>(initialCareTeam);
  const [guardians, setGuardians] = useState<Guardian[]>(initialGuardians);

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm space-y-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Emergency Contacts
      </h3>

      <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
        <Bell className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          These contacts are automatically notified during detected episodes of arrhythmia, cardiac arrest, or ICD shock.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Care Team</h4>
          </div>
          <EditCareTeamDialog careTeam={careTeam} onSave={setCareTeam} />
        </div>
        <div className="space-y-2">
          {careTeam.length === 0 && (
            <p className="text-sm text-muted-foreground italic p-3">No clinicians added yet.</p>
          )}
          {careTeam.map((c) => (
            <div key={c.email} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.role}</p>
              </div>
              <p className="text-sm text-muted-foreground">{c.email}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Friends & Guardians</h4>
          </div>
          <EditGuardiansDialog guardians={guardians} onSave={setGuardians} />
        </div>
        <div className="space-y-2">
          {guardians.length === 0 && (
            <p className="text-sm text-muted-foreground italic p-3">No guardians added yet.</p>
          )}
          {guardians.map((g) => (
            <div key={g.phone} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.relationship}</p>
              </div>
              <p className="text-sm text-muted-foreground">{g.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
