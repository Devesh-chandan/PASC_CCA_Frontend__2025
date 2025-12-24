"use client";

import { useState, useEffect } from 'react';
import { FileText, Video, Code, Link as LinkIcon, Download, ExternalLink } from 'lucide-react';
import { resourceAPI } from '@/lib/api';
import { EventResource, ResourceType } from '@/types/resource';
import { Skeleton } from '../ui/skeleton';
import { formatFileSize } from '@/lib/utils';

interface ResourceSectionProps {
  eventId: number;
}

const resourceIcons: Record<ResourceType, React.ReactNode> = {
  SLIDES: <FileText className="w-5 h-5 text-blue-500" />,
  VIDEO: <Video className="w-5 h-5 text-red-500" />,
  CODE: <Code className="w-5 h-5 text-green-500" />,
  DOCUMENT: <FileText className="w-5 h-5 text-purple-500" />,
  LINK: <LinkIcon className="w-5 h-5 text-orange-500" />,
  OTHER: <FileText className="w-5 h-5 text-gray-500" />,
};

const resourceColors: Record<ResourceType, string> = {
  SLIDES: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  VIDEO: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  CODE: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
  DOCUMENT: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
  LINK: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
  OTHER: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800',
};

export function ResourceSection({ eventId }: ResourceSectionProps) {
  const [resources, setResources] = useState<EventResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, [eventId]);

  const fetchResources = async () => {
    try {
      const response = await resourceAPI.getEventResources(eventId);
      if (response.data?.success && response.data.data) {
        setResources(response.data.data as EventResource[]);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No resources available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resources.map(resource => (
        <a
          key={resource.id}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`block p-4 rounded-lg border ${resourceColors[resource.type]} hover:shadow-md transition-all`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {resourceIcons[resource.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{resource.title}</h4>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {resource.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="font-medium uppercase">{resource.type}</span>
                    {resource.fileSize && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(resource.fileSize)}</span>
                      </>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

