"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
import { motion } from "framer-motion"

interface ProfileHeaderProps {
  isSaving: boolean
  onSave: (e: React.FormEvent) => Promise<void>
}

export function ProfileHeader({ isSaving, onSave }: ProfileHeaderProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and preferences</p>
        </div>
        <Button onClick={onSave} className="bg-violet-700 hover:bg-violet-800 text-white" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}
