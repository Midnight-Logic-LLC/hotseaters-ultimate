/**
 * wizard-step2-case-details.tsx — port of
 * HotSeatersMVP/src/components/deals/WizardStep2CaseDetails.jsx.
 *
 * Step 2 of the deal wizard: Case Information · Trial Details (date range +
 * segments) · Venue & Court (courthouse / court / judge typeahead with custom
 * entry). Three-column layout (stacks on mobile).
 *
 * Port adaptations (RULE 0):
 *   • The trial-date range picker reproduces the bible's two-pane single-month
 *     range UI exactly (from/to toggle + range modifiers).
 *   • The segments toggle wires the port's `TrialSegmentsPanel` (edit mode only),
 *     matching the bible's `TrialSegmentsSection` embed.
 *   • Venue/court/judge lists are seeded by `useVenueSearch` (no online lookup
 *     in the port — see that hook); custom-entry is fully functional.
 *
 * Components consume hook-supplied props only (RULE B). HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, RefreshCw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrialSegmentsPanel } from '@/features/trials/components/trial-segments-panel';
import type { Trial, TrialSegment } from '@/features/trials/entities';
import type { PipelineStage } from '@/shared/db/lookups-selectors';
import type {
  VenueSuggestion,
  CourtSuggestion,
  JudgeSuggestion,
} from '@/features/deals/hooks/use-venue-search';
import type { DealFormData, DateRangeValue, RangePickerSide } from './deal-wizard-types';

const US_STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'], ['DC', 'Washington DC'],
];

const CASE_TYPES = [
  'Personal Injury', 'Medical Malpractice', 'Product Liability', 'Employment',
  'Commercial Litigation', 'Contract Dispute', 'Intellectual Property',
  'Construction Defect', 'Class Action', 'Criminal Defense', 'Insurance Defense',
  'Wrongful Death', 'Environmental', 'Securities Litigation', 'Other',
];

const SELECT_CONTENT_STYLE: React.CSSProperties = {
  fontFamily: 'var(--theme-font-body)',
  fontSize: 'var(--theme-text-body)',
};

interface WizardStep2Props {
  dealData: DealFormData;
  setDealData: (next: DealFormData) => void;
  dateRange: DateRangeValue | undefined;
  setDateRange: (next: DateRangeValue | undefined) => void;
  activeRangePicker: RangePickerSide;
  setActiveRangePicker: (side: RangePickerSide) => void;
  trial: Trial | null;
  pipelineStages: PipelineStage[];
  segments: TrialSegment[];
  venueSuggestions: VenueSuggestion[];
  setVenueSuggestions: React.Dispatch<React.SetStateAction<VenueSuggestion[]>>;
  isSearchingVenue: boolean;
  searchVenues: (city: string, state: string, existingValue?: string | null) => void;
  courtSuggestions: CourtSuggestion[];
  setCourtSuggestions: React.Dispatch<React.SetStateAction<CourtSuggestion[]>>;
  isSearchingCourts: boolean;
  searchCourts: (courthouse: string, existingValue?: string | null) => void;
  judgeSuggestions: JudgeSuggestion[];
  setJudgeSuggestions: React.Dispatch<React.SetStateAction<JudgeSuggestion[]>>;
  isSearchingJudges: boolean;
  searchJudges: (courthouse: string, court: string, existingValue?: string | null) => void;
}

export function WizardStep2CaseDetails({
  dealData,
  setDealData,
  dateRange,
  setDateRange,
  activeRangePicker,
  setActiveRangePicker,
  trial,
  pipelineStages,
  segments,
  venueSuggestions,
  setVenueSuggestions,
  isSearchingVenue,
  searchVenues,
  courtSuggestions,
  setCourtSuggestions,
  isSearchingCourts,
  searchCourts,
  judgeSuggestions,
  setJudgeSuggestions,
  isSearchingJudges,
  searchJudges,
}: WizardStep2Props) {
  const [showSegments, setShowSegments] = useState(segments.length > 0);
  const [showCustomCourthouseInput, setShowCustomCourthouseInput] = useState(false);
  const [showCustomCourtInput, setShowCustomCourtInput] = useState(false);
  const [showCustomJudgeInput, setShowCustomJudgeInput] = useState(false);
  const [customCourthouseValue, setCustomCourthouseValue] = useState('');
  const [customCourtValue, setCustomCourtValue] = useState('');
  const [customJudgeValue, setCustomJudgeValue] = useState('');

  const isExistingTrial =
    !!trial && pipelineStages.find((s) => s.id === trial.pipeline_stage_id)?.type === 'operations';

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Column 1: Case Information */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-stone-200 mb-4">
          <h3 className="font-semibold text-stone-900">Case Information</h3>
        </div>
        <div>
          <Label htmlFor="case_name">Case Name *</Label>
          <Input
            id="case_name"
            value={dealData.case_name}
            onChange={(e) => {
              const n = e.target.value;
              setDealData({
                ...dealData,
                case_name: n,
                case_style:
                  dealData.case_style === dealData.case_name || !dealData.case_style
                    ? n
                    : dealData.case_style,
              });
            }}
            placeholder="e.g., Smith v. Jones"
            className="bg-purple-50"
          />
        </div>
        <div>
          <Label htmlFor="side">Our Side</Label>
          <Select
            value={dealData.side && dealData.side.length > 0 ? dealData.side : undefined}
            onValueChange={(value) => setDealData({ ...dealData, side: value ?? '' })}
          >
            <SelectTrigger id="side">
              <SelectValue placeholder="Select side" />
            </SelectTrigger>
            <SelectContent style={SELECT_CONTENT_STYLE}>
              <SelectItem value="plaintiff">Plaintiff</SelectItem>
              <SelectItem value="defense">Defense</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="case_type">Case Type</Label>
          <Select
            value={
              dealData.case_type && dealData.case_type.length > 0 ? dealData.case_type : undefined
            }
            onValueChange={(value) => setDealData({ ...dealData, case_type: value ?? '' })}
          >
            <SelectTrigger id="case_type">
              <SelectValue placeholder="Select case type" />
            </SelectTrigger>
            <SelectContent style={SELECT_CONTENT_STYLE}>
              {CASE_TYPES.map((ct) => (
                <SelectItem key={ct} value={ct}>
                  {ct}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Column 2: Trial Details */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-stone-200 mb-4">
          <h3 className="font-semibold text-stone-900">Trial Details</h3>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Trial Date Range *</Label>
            {trial && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSegments(!showSegments)}
                        className={`h-6 px-2 text-xs gap-1 ${
                          showSegments
                            ? 'text-indigo-600 bg-indigo-50'
                            : 'text-stone-400 hover:text-indigo-600'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        {segments.length > 0 ? `${segments.length + 1} Segments` : 'Segments'}
                      </Button>
                    }
                  />
                  <TooltipContent side="top">
                    <p>Manage trial segments</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-purple-50">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'MMM d, yyyy')} -{' '}
                        {format(dateRange.to, 'MMM d, yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'MMM d, yyyy')
                    )
                  ) : (
                    <span className="text-stone-500">Select date range</span>
                  )}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b border-stone-200 bg-stone-50">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveRangePicker('from')}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      activeRangePicker === 'from'
                        ? 'bg-indigo-100 border-2 border-indigo-600'
                        : 'bg-white border border-stone-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-xs font-medium text-stone-600 mb-1">Start Date</div>
                    <div
                      className={`text-sm font-semibold ${
                        activeRangePicker === 'from' ? 'text-indigo-600' : 'text-stone-900'
                      }`}
                    >
                      {dateRange?.from ? format(dateRange.from, 'MMM d, yyyy') : 'Not set'}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRangePicker('to')}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      activeRangePicker === 'to'
                        ? 'bg-indigo-100 border-2 border-indigo-600'
                        : 'bg-white border border-stone-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-xs font-medium text-stone-600 mb-1">End Date</div>
                    <div
                      className={`text-sm font-semibold ${
                        activeRangePicker === 'to' ? 'text-indigo-600' : 'text-stone-900'
                      }`}
                    >
                      {dateRange?.to ? format(dateRange.to, 'MMM d, yyyy') : 'Not set'}
                    </div>
                  </button>
                </div>
              </div>
              <Calendar
                mode="single"
                {...(dateRange?.from ? { defaultMonth: dateRange.from } : {})}
                {...(() => {
                  const sel = activeRangePicker === 'from' ? dateRange?.from : dateRange?.to;
                  return sel ? { selected: sel } : {};
                })()}
                onSelect={(date) => {
                  if (!date) return;
                  if (activeRangePicker === 'from') {
                    if (dateRange?.from && date.getTime() === dateRange.from.getTime()) {
                      setActiveRangePicker('to');
                      return;
                    }
                    const newTo = dateRange?.to && date > dateRange.to ? date : dateRange?.to;
                    const newRange = { from: date, to: newTo };
                    setDateRange(newRange);
                    setDealData({
                      ...dealData,
                      start_date: format(date, 'yyyy-MM-dd'),
                      end_date: newTo
                        ? format(newTo, 'yyyy-MM-dd')
                        : format(date, 'yyyy-MM-dd'),
                    });
                    setActiveRangePicker('to');
                  } else {
                    if (dateRange?.to && date.getTime() === dateRange.to.getTime()) {
                      setActiveRangePicker('from');
                      return;
                    }
                    const newRange = { from: dateRange?.from, to: date };
                    setDateRange(newRange);
                    setDealData({
                      ...dealData,
                      start_date: newRange.from
                        ? format(newRange.from, 'yyyy-MM-dd')
                        : format(date, 'yyyy-MM-dd'),
                      end_date: format(date, 'yyyy-MM-dd'),
                    });
                    setActiveRangePicker('from');
                  }
                }}
                disabled={(date) => {
                  const today = new Date(new Date().setHours(0, 0, 0, 0));
                  if (!isExistingTrial && date < today) return true;
                  if (activeRangePicker === 'to' && dateRange?.from) return date < dateRange.from;
                  return false;
                }}
              />
            </PopoverContent>
          </Popover>
          {showSegments && trial && (
            <div className="mt-3">
              <TrialSegmentsPanel trial={trial} canEdit />
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="case_style">Case Style</Label>
          <Input
            id="case_style"
            value={dealData.case_style}
            onChange={(e) => setDealData({ ...dealData, case_style: e.target.value })}
            placeholder="e.g., John Smith, et al. v. Bob Jones LLC"
          />
        </div>
        <div>
          <Label htmlFor="case_number">Cause Number</Label>
          <Input
            id="case_number"
            value={dealData.case_number}
            onChange={(e) => setDealData({ ...dealData, case_number: e.target.value })}
            placeholder="e.g., 2023-12345"
          />
        </div>
      </div>

      {/* Column 3: Venue & Court */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-stone-200 mb-4">
          <h3 className="font-semibold text-stone-900">Venue &amp; Court</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={dealData.city}
              onChange={(e) => {
                setDealData({ ...dealData, city: e.target.value });
                setVenueSuggestions([]);
              }}
              placeholder="City"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Select
              value={dealData.state && dealData.state.length > 0 ? dealData.state : undefined}
              onValueChange={(value) => {
                setDealData({ ...dealData, state: value ?? '' });
                setVenueSuggestions([]);
              }}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent style={SELECT_CONTENT_STYLE}>
                {US_STATES.map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="courthouse">Courthouse</Label>
            {dealData.city && dealData.state && venueSuggestions.length === 0 && !isSearchingVenue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => searchVenues(dealData.city, dealData.state)}
                className="text-indigo-600 h-6"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Load Courthouses
              </Button>
            )}
          </div>
          {showCustomCourthouseInput ? (
            <div className="space-y-2">
              <Input
                id="courthouse"
                value={customCourthouseValue}
                onChange={(e) => setCustomCourthouseValue(e.target.value)}
                placeholder="Enter courthouse name"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (customCourthouseValue.trim()) {
                      const nv = customCourthouseValue.trim();
                      setDealData({ ...dealData, courthouse: nv, court: '', judge: '' });
                      setVenueSuggestions((prev) =>
                        [...prev.filter((v) => v.courthouse !== nv), { courthouse: nv, isExisting: true }].sort(
                          (a, b) => a.courthouse.localeCompare(b.courthouse),
                        ),
                      );
                      setCourtSuggestions([]);
                      setJudgeSuggestions([]);
                      setShowCustomCourthouseInput(false);
                      setCustomCourthouseValue('');
                      searchCourts(nv);
                    }
                  }}
                  style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
                >
                  Set Courthouse
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCustomCourthouseInput(false);
                    setCustomCourthouseValue('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Select
              value={dealData.courthouse || undefined}
              onValueChange={(raw) => {
                const value = raw ?? '';
                if (value === '__custom__') {
                  setShowCustomCourthouseInput(true);
                  setCustomCourthouseValue('');
                } else {
                  setDealData({ ...dealData, courthouse: value, court: '', judge: '' });
                  setCourtSuggestions([]);
                  setJudgeSuggestions([]);
                  searchCourts(value, dealData.court);
                }
              }}
              disabled={!dealData.city || !dealData.state}
            >
              <SelectTrigger
                id="courthouse"
                className={!dealData.city || !dealData.state ? 'bg-stone-100' : ''}
              >
                <SelectValue
                  placeholder={
                    !dealData.city || !dealData.state
                      ? 'Select city and state first'
                      : isSearchingVenue
                        ? 'Loading courthouses...'
                        : venueSuggestions.length === 0
                          ? "Click 'Load Courthouses' above"
                          : 'Select courthouse'
                  }
                />
              </SelectTrigger>
              <SelectContent style={SELECT_CONTENT_STYLE}>
                {venueSuggestions.map((venue, idx) => (
                  <SelectItem
                    key={idx}
                    value={venue.courthouse}
                    className={venue.isExisting ? 'bg-yellow-50 font-medium' : ''}
                  >
                    {venue.courthouse}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__" className="border-t mt-1 pt-1 text-indigo-600 font-medium">
                  + Enter custom courthouse
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="court">Court Number</Label>
              {dealData.courthouse && courtSuggestions.length === 0 && !isSearchingCourts && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => searchCourts(dealData.courthouse)}
                  className="text-indigo-600 h-6"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Load Courts
                </Button>
              )}
            </div>
            {showCustomCourtInput ? (
              <div className="space-y-2">
                <Input
                  id="court"
                  value={customCourtValue}
                  onChange={(e) => setCustomCourtValue(e.target.value)}
                  placeholder="Enter court number"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (customCourtValue.trim()) {
                        const nv = customCourtValue.trim();
                        setDealData({ ...dealData, court: nv, judge: '' });
                        setCourtSuggestions((prev) =>
                          [...prev.filter((c) => c.court !== nv), { court: nv, isExisting: true }].sort(
                            (a, b) => a.court.localeCompare(b.court),
                          ),
                        );
                        setJudgeSuggestions([]);
                        setShowCustomCourtInput(false);
                        setCustomCourtValue('');
                        searchJudges(dealData.courthouse, nv, dealData.judge);
                      }
                    }}
                    style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
                  >
                    Set Court
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCustomCourtInput(false);
                      setCustomCourtValue('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Select
                value={dealData.court || undefined}
                onValueChange={(raw) => {
                  const value = raw ?? '';
                  if (value === '__custom__') {
                    setShowCustomCourtInput(true);
                    setCustomCourtValue('');
                  } else {
                    setDealData({ ...dealData, court: value, judge: '' });
                    setJudgeSuggestions([]);
                    searchJudges(dealData.courthouse, value, dealData.judge);
                  }
                }}
                disabled={!dealData.courthouse}
              >
                <SelectTrigger id="court" className={!dealData.courthouse ? 'bg-stone-100' : ''}>
                  <SelectValue
                    placeholder={
                      !dealData.courthouse
                        ? 'Select courthouse first'
                        : isSearchingCourts
                          ? 'Loading courts...'
                          : courtSuggestions.length === 0
                            ? "Click 'Load Courts' above"
                            : 'Select court'
                    }
                  />
                </SelectTrigger>
                <SelectContent style={SELECT_CONTENT_STYLE}>
                  {courtSuggestions.map((court, idx) => (
                    <SelectItem
                      key={idx}
                      value={court.court}
                      className={court.isExisting ? 'bg-yellow-50 font-medium' : ''}
                    >
                      {court.court}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="border-t mt-1 pt-1 text-indigo-600 font-medium">
                    + Enter custom court number
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label htmlFor="judge">Judge</Label>
            {showCustomJudgeInput ? (
              <div className="space-y-2">
                <Input
                  id="judge"
                  value={customJudgeValue}
                  onChange={(e) => setCustomJudgeValue(e.target.value)}
                  placeholder="Enter judge name"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (customJudgeValue.trim()) {
                        const nv = customJudgeValue.trim();
                        setDealData({ ...dealData, judge: nv });
                        setJudgeSuggestions((prev) =>
                          [...prev.filter((j) => j.judge !== nv), { judge: nv, isExisting: true }].sort(
                            (a, b) => a.judge.localeCompare(b.judge),
                          ),
                        );
                        setShowCustomJudgeInput(false);
                        setCustomJudgeValue('');
                      }
                    }}
                    style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
                  >
                    Set Judge
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCustomJudgeInput(false);
                      setCustomJudgeValue('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Select
                value={dealData.judge || undefined}
                onValueChange={(raw) => {
                  const value = raw ?? '';
                  if (value === '__custom__') {
                    setShowCustomJudgeInput(true);
                    setCustomJudgeValue('');
                  } else {
                    setDealData({ ...dealData, judge: value });
                  }
                }}
                disabled={!dealData.court}
              >
                <SelectTrigger id="judge" className={!dealData.court ? 'bg-stone-100' : ''}>
                  <SelectValue
                    placeholder={
                      !dealData.court
                        ? 'Select court first'
                        : isSearchingJudges
                          ? 'Loading judges...'
                          : judgeSuggestions.length === 0
                            ? 'Loading...'
                            : 'Select judge'
                    }
                  />
                </SelectTrigger>
                <SelectContent style={SELECT_CONTENT_STYLE}>
                  {judgeSuggestions.map((judge, idx) => (
                    <SelectItem
                      key={idx}
                      value={judge.judge}
                      className={judge.isExisting ? 'bg-yellow-50 font-medium' : ''}
                    >
                      {judge.judge}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="border-t mt-1 pt-1 text-indigo-600 font-medium">
                    + Enter custom judge name
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
