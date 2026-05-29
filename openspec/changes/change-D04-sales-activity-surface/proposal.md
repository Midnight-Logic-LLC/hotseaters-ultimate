# change-D04 — Sales activity surface

## Why
The bible Deal model surfaces sales activities (notes, history, inline form,
cascade delete, add-contact) around deals. Port the activity components.

## What changes
Port: InlineSalesActivityForm, SalesActivityHistoryDialog, SalesNotesSection,
ActivityToolbar, NoNextStepConfirmModal, CascadeDeleteDialog, AddContactWizard.
Map to the port sales-activity entity/store. RULE C/D/G/H.

## Impact
App UI + hooks. Depends on D01. Bible components/sales/* @ 29ae47e3.
