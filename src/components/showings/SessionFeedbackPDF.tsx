import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

interface FeedbackData {
  topThingsLiked?: string;
  concerns?: string;
  lifestyleFit?: string;
  layoutThoughts?: string;
  priceFeel?: string;
  neighborhoodThoughts?: string;
  conditionConcerns?: string;
  nextStep?: string;
  investigateRequest?: string;
}

interface ClientPhoto {
  id: string;
  file_url: string;
  caption: string | null;
}

interface PropertyRating {
  rating: number | null;
  feedback: FeedbackData;
}

export interface PDFSessionProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  price: number | null;
  photo_url: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  showing_time?: string | null;
  rating?: PropertyRating;
  client_photos?: ClientPhoto[];
}

export interface PDFSessionData {
  title: string;
  client_name: string;
  session_date: string | null;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
}

const colors = {
  primary: '#1a1a2e',
  accent: '#c9a84c',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  bg: '#f9fafb',
  white: '#ffffff',
  green: '#16a34a',
  red: '#dc2626',
  blue: '#2563eb',
};

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  headerLeft: { flexDirection: 'column', gap: 2 },
  brandName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: colors.primary, letterSpacing: 0.5 },
  brandTagline: { fontSize: 9, color: colors.muted },
  headerRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  headerDate: { fontSize: 9, color: colors.muted },

  // Session info banner
  sessionBanner: {
    backgroundColor: colors.bg,
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  sessionTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 4 },
  sessionMeta: { fontSize: 9, color: colors.muted },

  // Property card
  propertyCard: {
    marginBottom: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  propertyHeader: {
    backgroundColor: colors.primary,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyNumber: { fontSize: 9, color: colors.accent, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  propertyAddress: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.white, flex: 1 },
  propertyPrice: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.accent },
  propertyBody: { padding: 12 },

  // Property stats row
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  statLabel: { fontSize: 8, color: colors.muted },
  statValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.text },

  // Rating
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ratingLabel: { fontSize: 9, color: colors.muted },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  ratingText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.white },
  nextStepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  nextStepText: { fontSize: 9, color: colors.white },

  // No feedback
  noFeedback: {
    padding: 10,
    backgroundColor: colors.bg,
    borderRadius: 4,
    marginBottom: 8,
  },
  noFeedbackText: { fontSize: 9, color: colors.muted, fontStyle: 'italic' },

  // Feedback fields
  feedbackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  feedbackField: { width: '47%' },
  feedbackFieldFull: { width: '100%', marginBottom: 6 },
  feedbackFieldLabel: { fontSize: 8, color: colors.muted, marginBottom: 2, fontFamily: 'Helvetica-Bold' },
  feedbackFieldValue: { fontSize: 9, color: colors.text, lineHeight: 1.4 },

  // Photos
  photosSection: { marginTop: 10 },
  photosSectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.muted, marginBottom: 6 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photoThumb: { width: 100, height: 75, borderRadius: 4, objectFit: 'cover' },
  photoCaption: { fontSize: 7, color: colors.muted, marginTop: 2, width: 100 },

  // Property photo (main)
  mainPhoto: { width: '100%', height: 120, objectFit: 'cover', marginBottom: 10, borderRadius: 4 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: colors.muted },

  // Page number
  pageNumber: { fontSize: 8, color: colors.muted },

  // Divider
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border, marginVertical: 8 },

  // Pill values
  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  pillText: { fontSize: 8, color: colors.text },
  pillGreen: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  pillGreenText: { fontSize: 8, color: colors.green },
  pillRed: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  pillRedText: { fontSize: 8, color: colors.red },
  pillBlue: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  pillBlueText: { fontSize: 8, color: colors.blue },
});

function formatPrice(price: number | null): string {
  if (!price) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatNextStep(val?: string): string {
  const map: Record<string, string> = {
    see_again: 'See it again',
    write_offer: 'Write offer!',
    keep_looking: 'Keep looking',
    sleep_on_it: 'Sleep on it',
  };
  return val ? (map[val] || val) : '';
}

function formatLifestyleFit(val?: string): string {
  const map: Record<string, string> = { yes: 'Yes', no: 'No', not_sure: 'Not sure' };
  return val ? (map[val] || val) : '';
}

function formatPriceFeel(val?: string): string {
  const map: Record<string, string> = { too_high: 'Too high', fair: 'Fair', great_value: 'Great value' };
  return val ? (map[val] || val) : '';
}

function ratingColor(rating: number): string {
  if (rating >= 8) return '#16a34a';
  if (rating >= 5) return '#d97706';
  return '#dc2626';
}

interface PropertyPageProps {
  property: PDFSessionProperty;
  index: number;
  session: PDFSessionData;
  totalProperties: number;
}

function PropertySection({ property, index }: PropertyPageProps) {
  const feedback = property.rating?.feedback;
  const rating = property.rating?.rating;
  const hasFeedback = !!property.rating;
  const photos = property.client_photos || [];

  return (
    <View style={s.propertyCard}>
      {/* Card header */}
      <View style={s.propertyHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.propertyNumber}>Property {index + 1}</Text>
          <Text style={s.propertyAddress}>{property.address}</Text>
          {(property.city || property.state) && (
            <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>
              {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>
        {property.price && (
          <Text style={s.propertyPrice}>{formatPrice(property.price)}</Text>
        )}
      </View>

      <View style={s.propertyBody}>
        {/* Stats */}
        {(property.beds || property.baths || property.sqft) && (
          <View style={s.statsRow}>
            {property.beds && (
              <View style={s.statItem}>
                <Text style={s.statValue}>{property.beds}</Text>
                <Text style={s.statLabel}> bd</Text>
              </View>
            )}
            {property.baths && (
              <View style={s.statItem}>
                <Text style={s.statValue}>{property.baths}</Text>
                <Text style={s.statLabel}> ba</Text>
              </View>
            )}
            {property.sqft && (
              <View style={s.statItem}>
                <Text style={s.statValue}>{property.sqft.toLocaleString()}</Text>
                <Text style={s.statLabel}> sqft</Text>
              </View>
            )}
            {property.showing_time && (
              <View style={{ marginLeft: 'auto' }}>
                <Text style={[s.statLabel, { textAlign: 'right' }]}>Showing time</Text>
                <Text style={[s.statValue, { textAlign: 'right' }]}>{property.showing_time}</Text>
              </View>
            )}
          </View>
        )}

        {/* Feedback section */}
        {!hasFeedback ? (
          <View style={s.noFeedback}>
            <Text style={s.noFeedbackText}>No feedback submitted yet for this property.</Text>
          </View>
        ) : (
          <>
            {/* Rating + next step */}
            <View style={s.ratingRow}>
              <Text style={s.ratingLabel}>Rating:</Text>
              <View style={[s.ratingBadge, { backgroundColor: ratingColor(rating!) }]}>
                <Text style={s.ratingText}>{rating}/10</Text>
              </View>
              {feedback?.nextStep && (
                <>
                  <Text style={s.ratingLabel}>Next step:</Text>
                  <View style={s.nextStepBadge}>
                    <Text style={s.nextStepText}>{formatNextStep(feedback.nextStep)}</Text>
                  </View>
                </>
              )}
              {feedback?.lifestyleFit && (
                <>
                  <Text style={s.ratingLabel}>Lifestyle fit:</Text>
                  <Text style={[s.feedbackFieldValue, { fontFamily: 'Helvetica-Bold' }]}>
                    {formatLifestyleFit(feedback.lifestyleFit)}
                  </Text>
                </>
              )}
              {feedback?.priceFeel && (
                <>
                  <Text style={s.ratingLabel}>Price:</Text>
                  <Text style={[s.feedbackFieldValue, { fontFamily: 'Helvetica-Bold' }]}>
                    {formatPriceFeel(feedback.priceFeel)}
                  </Text>
                </>
              )}
            </View>

            {/* Text feedback fields */}
            <View style={s.feedbackGrid}>
              {feedback?.topThingsLiked && (
                <View style={s.feedbackField}>
                  <Text style={s.feedbackFieldLabel}>Top things liked</Text>
                  <Text style={s.feedbackFieldValue}>{feedback.topThingsLiked}</Text>
                </View>
              )}
              {feedback?.concerns && (
                <View style={s.feedbackField}>
                  <Text style={s.feedbackFieldLabel}>Concerns / dealbreakers</Text>
                  <Text style={s.feedbackFieldValue}>{feedback.concerns}</Text>
                </View>
              )}
              {feedback?.layoutThoughts && (
                <View style={s.feedbackField}>
                  <Text style={s.feedbackFieldLabel}>Layout & flow</Text>
                  <Text style={s.feedbackFieldValue}>{feedback.layoutThoughts}</Text>
                </View>
              )}
              {feedback?.neighborhoodThoughts && (
                <View style={s.feedbackField}>
                  <Text style={s.feedbackFieldLabel}>Neighborhood</Text>
                  <Text style={s.feedbackFieldValue}>{feedback.neighborhoodThoughts}</Text>
                </View>
              )}
              {feedback?.conditionConcerns && (
                <View style={s.feedbackField}>
                  <Text style={s.feedbackFieldLabel}>Condition concerns</Text>
                  <Text style={s.feedbackFieldValue}>{feedback.conditionConcerns}</Text>
                </View>
              )}
              {feedback?.investigateRequest && (
                <View style={s.feedbackFieldFull}>
                  <Text style={s.feedbackFieldLabel}>Items to investigate</Text>
                  <Text style={s.feedbackFieldValue}>{feedback.investigateRequest}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Client photos */}
        {photos.length > 0 && (
          <View style={s.photosSection}>
            <View style={s.divider} />
            <Text style={s.photosSectionTitle}>Client Photos ({photos.length})</Text>
            <View style={s.photosGrid}>
              {photos.map((photo) => (
                <View key={photo.id}>
                  <Image style={s.photoThumb} src={photo.file_url} />
                  {photo.caption && (
                    <Text style={s.photoCaption}>{photo.caption}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

interface SessionFeedbackPDFProps {
  session: PDFSessionData;
  properties: PDFSessionProperty[];
}

export function SessionFeedbackPDF({ session, properties }: SessionFeedbackPDFProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const propertiesWithFeedback = properties.filter(p => p.rating).length;

  return (
    <Document
      title={`${session.title} - Feedback Report`}
      author="HomeFolio"
      subject={`Buyer feedback for ${session.client_name}`}
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.brandName}>HomeFolio</Text>
            <Text style={s.brandTagline}>Buyer Feedback Report</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerDate}>Generated: {generatedDate}</Text>
            {session.agentName && <Text style={s.headerDate}>{session.agentName}</Text>}
            {session.agentPhone && <Text style={s.headerDate}>{session.agentPhone}</Text>}
            {session.agentEmail && <Text style={s.headerDate}>{session.agentEmail}</Text>}
          </View>
        </View>

        {/* Session banner */}
        <View style={s.sessionBanner}>
          <Text style={s.sessionTitle}>{session.title}</Text>
          <Text style={s.sessionMeta}>
            Client: {session.client_name}
            {session.session_date ? `  ·  ${formatDate(session.session_date)}` : ''}
            {`  ·  ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}
            {propertiesWithFeedback > 0 ? `  ·  ${propertiesWithFeedback} with feedback` : ''}
          </Text>
        </View>

        {/* Properties */}
        {properties.map((property, index) => (
          <PropertySection
            key={property.id}
            property={property}
            index={index}
            session={session}
            totalProperties={properties.length}
          />
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>HomeFolio · Buyer Feedback Report · {session.title}</Text>
          <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
