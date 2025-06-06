-- Create SQL function for getting frequent error codes
CREATE OR REPLACE FUNCTION get_frequent_error_codes(start_date TIMESTAMP, max_results INTEGER)
RETURNS TABLE (error_code TEXT, error_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    "errorCode" as error_code, 
    COUNT(*) as error_count
  FROM 
    error_logs
  WHERE 
    "timestamp" >= start_date
  GROUP BY 
    "errorCode"
  ORDER BY 
    error_count DESC
  LIMIT 
    max_results;
END;
$$ LANGUAGE plpgsql;

-- Create SQL function for getting error trends
CREATE OR REPLACE FUNCTION get_error_trends(start_date TIMESTAMP, tool_filter TEXT DEFAULT NULL)
RETURNS TABLE (error_date DATE, error_count BIGINT) AS $$
BEGIN
  IF tool_filter IS NULL THEN
    RETURN QUERY
    SELECT 
      DATE("timestamp") as error_date, 
      COUNT(*) as error_count
    FROM 
      error_logs
    WHERE 
      "timestamp" >= start_date
    GROUP BY 
      error_date
    ORDER BY 
      error_date ASC;
  ELSE
    RETURN QUERY
    SELECT 
      DATE("timestamp") as error_date, 
      COUNT(*) as error_count
    FROM 
      error_logs
    WHERE 
      "timestamp" >= start_date AND
      tool = tool_filter
    GROUP BY 
      error_date
    ORDER BY 
      error_date ASC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create table for fallback messages if it doesn't exist
CREATE TABLE IF NOT EXISTS fallback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool TEXT NOT NULL,
  "agentId" TEXT,
  message TEXT NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedBy" TEXT NOT NULL,
  UNIQUE(tool, "agentId")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fallback_messages_tool ON fallback_messages(tool);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs("timestamp");
CREATE INDEX IF NOT EXISTS idx_error_logs_tool ON error_logs(tool);
CREATE INDEX IF NOT EXISTS idx_error_logs_errorcode ON error_logs("errorCode");
