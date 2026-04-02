{{- define "cardano-mcp.labels" -}}
app: {{ .Release.Name }}
app.kubernetes.io/name: cardano-mcp
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "cardano-mcp.selectorLabels" -}}
app: {{ .Release.Name }}
{{- end }}

{{- define "cardano-mcp.secretName" -}}
{{- if .Values.secrets.existingSecret -}}
{{ .Values.secrets.existingSecret }}
{{- else -}}
{{ .Release.Name }}-secrets
{{- end }}
{{- end }}
