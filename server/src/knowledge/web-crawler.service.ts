import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import { URL } from 'url';

@Injectable()
export class WebCrawlerService {
  private readonly logger = new Logger(WebCrawlerService.name);
  private readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private readonly requestDelay = 1000;

  async crawl(
    url: string,
  ): Promise<{ title: string; content: string; url: string }> {
    this.logger.log(`开始爬取网页: ${url}`);

    try {
      new URL(url);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: 30000,
      });

      const html = response.data;

      const title = this.extractTitle(html);
      const content = this.extractMainContent(html);

      this.logger.log(`网页爬取成功，标题: ${title}`);

      return {
        title,
        content,
        url,
      };
    } catch (error) {
      this.logger.error(`网页爬取失败: ${(error as Error).message}`);
      throw new BadRequestException(
        `网页爬取失败: ${(error as Error).message}`,
      );
    }
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
    return '';
  }

  private extractMainContent(html: string): string {
    let content = html;

    const unwantedTags = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /<style[^>]*>[\s\S]*?<\/style>/gi,
      /<nav[^>]*>[\s\S]*?<\/nav>/gi,
      /<header[^>]*>[\s\S]*?<\/header>/gi,
      /<footer[^>]*>[\s\S]*?<\/footer>/gi,
      /<aside[^>]*>[\s\S]*?<\/aside>/gi,
    ];

    for (const tagRegex of unwantedTags) {
      content = content.replace(tagRegex, '');
    }

    content = content.replace(/<[^>]+>/g, ' ');

    content = content.replace(/\s+/g, ' ').trim();
    content = content.replace(/\n\s*\n/g, '\n\n');

    return content;
  }
}
