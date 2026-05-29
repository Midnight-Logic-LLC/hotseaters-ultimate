# change-D03 — Deal wizard

## Why
The bible creates deals via a multi-step DealWizard (components/deals/*). The
port has no equivalent. Required for deal creation at the correct pipeline stage.

## What changes
Port components/deals/*: DealWizard, WizardStep1ClientContact,
WizardStep2CaseDetails, AvailableServicesColumn, ServiceSegmentSelector,
WizardDialogs, useVenueSearch. Creates a trial at the initial pipeline stage
(deal). Reuses trial CRUD hooks/store. RULE C/D/G/H.

## Impact
App UI + hooks. Depends on D01. Bible: components/deals/* @ 29ae47e3.
